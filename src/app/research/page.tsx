import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole } from "@/lib/auth";
import {
  addObservation,
  completeSession,
  createParticipant,
  createSession,
  updateConsents,
} from "@/app/actions/admin";
import { SectionHeading } from "@/components/section-heading";
import { formatDate } from "@/lib/core";

export const dynamic = "force-dynamic";
export const metadata = { title: "Research" };

const CONSENTS: { key: string; label: string }[] = [
  { key: "consent_research", label: "Research participation" },
  { key: "consent_recording", label: "Session recording" },
  { key: "consent_public_content", label: "Content may be public" },
  { key: "consent_marketing", label: "Marketing use" },
  { key: "consent_testimonial", label: "Testimonial use" },
];

interface ParticipantRow {
  id: string;
  participant_code: string;
  persona_type: string | null;
  recruitment_source: string | null;
  is_minor: boolean;
  guardian_consent: boolean;
  consent_research: boolean;
  consent_recording: boolean;
  consent_public_content: boolean;
  consent_marketing: boolean;
  consent_testimonial: boolean;
  withdrawal_requested: boolean;
  session_status: string;
  [key: string]: string | boolean | null;
}

interface SessionRow {
  id: string;
  participant_id: string;
  session_date: string;
  session_type: string;
  completion_status: string;
  summary: string | null;
  research_observations: { id: string; task_code: string; observation_type: string; note: string }[];
}

export default async function ResearchPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/research");
  if (!hasRole(profile, ["researcher", "admin"])) redirect("/home");

  const supabase = await createClient();
  const [{ data: participantsData }, { data: sessionsData }] = await Promise.all([
    supabase
      .from("research_participants")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("research_sessions")
      .select(
        "id, participant_id, session_date, session_type, completion_status, summary, research_observations(id, task_code, observation_type, note)"
      )
      .order("session_date", { ascending: false }),
  ]);

  const participants = (participantsData ?? []) as ParticipantRow[];
  const sessions = (sessionsData ?? []) as unknown as SessionRow[];
  const codeById = new Map(participants.map((p) => [p.id, p.participant_code]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      <header>
        <p className="eyebrow mb-2">Research operations</p>
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
          Participants, consent, and sessions
        </h1>
        <p className="text-sm text-ink-soft mt-2 max-w-2xl">
          Consent states are independent. Research consent never implies
          publication, marketing, or testimonial consent. Participants under 18
          require documented guardian consent before research consent is valid;
          the database enforces this.
        </p>
      </header>

      <section>
        <SectionHeading eyebrow="Recruit" title="Add a participant" />
        <form action={createParticipant} className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="rp-persona" className="label">
              Persona type
            </label>
            <input
              id="rp-persona"
              name="persona_type"
              type="text"
              placeholder="Memory keeper, taste sharer..."
              className="field"
            />
          </div>
          <div>
            <label htmlFor="rp-source" className="label">
              Recruitment source
            </label>
            <input
              id="rp-source"
              name="recruitment_source"
              type="text"
              placeholder="Referral, community post..."
              className="field"
            />
          </div>
          <div className="flex items-center gap-2 pb-2.5">
            <input id="rp-minor" name="is_minor" type="checkbox" />
            <label htmlFor="rp-minor" className="text-sm">
              Under 18
            </label>
          </div>
          <button type="submit" className="btn btn-primary">
            Add participant
          </button>
        </form>
      </section>

      <section>
        <SectionHeading
          eyebrow="Consent ledger"
          title="Participants"
          sub="Codes only. Keep names and contact details out of this system."
        />
        <div className="space-y-4">
          {participants.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-meta font-medium">{p.participant_code}</span>
                {p.persona_type && <span>{p.persona_type}</span>}
                {p.recruitment_source && (
                  <span className="text-ink-soft">via {p.recruitment_source}</span>
                )}
                {p.is_minor && (
                  <span className="rounded-full bg-chile/10 text-chile px-2 py-0.5 text-xs font-medium">
                    Minor: guardian consent required
                  </span>
                )}
                {p.withdrawal_requested && (
                  <span className="rounded-full bg-ink text-raised px-2 py-0.5 text-xs">
                    Withdrawal requested
                  </span>
                )}
              </div>
              <form action={updateConsents} className="mt-3">
                <input type="hidden" name="participant_id" value={p.id} />
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {p.is_minor && (
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        name="guardian_consent"
                        defaultChecked={p.guardian_consent}
                      />
                      Guardian consent on file
                    </label>
                  )}
                  {CONSENTS.map((c) => (
                    <label key={c.key} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        name={c.key}
                        defaultChecked={Boolean(p[c.key])}
                      />
                      {c.label}
                    </label>
                  ))}
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      name="withdrawal_requested"
                      defaultChecked={p.withdrawal_requested}
                    />
                    Withdrawal requested
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label htmlFor={`status-${p.id}`} className="text-sm">
                    Status
                  </label>
                  <select
                    id={`status-${p.id}`}
                    name="session_status"
                    defaultValue={p.session_status}
                    className="field max-w-[180px]"
                  >
                    <option value="recruited">Recruited</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  <button type="submit" className="btn btn-secondary text-sm">
                    Save consents
                  </button>
                </div>
              </form>
              <form action={createSession} className="mt-3 flex items-center gap-2">
                <input type="hidden" name="participant_id" value={p.id} />
                <label htmlFor={`stype-${p.id}`} className="sr-only">
                  Session type
                </label>
                <select id={`stype-${p.id}`} name="session_type" className="field max-w-[160px]">
                  <option value="remote">Remote</option>
                  <option value="in_person">In person</option>
                </select>
                <button type="submit" className="btn btn-secondary text-sm">
                  Schedule session
                </button>
              </form>
            </div>
          ))}
          {participants.length === 0 && (
            <p className="text-sm text-ink-soft">No participants yet.</p>
          )}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Sessions"
          title="Session log"
          sub="Log observations against PRD task codes: create-taco, add-ingredient, publish, respond, share."
        />
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-meta font-medium">
                  {codeById.get(s.participant_id) ?? "Unknown"}
                </span>
                <span>{s.session_type === "in_person" ? "In person" : "Remote"}</span>
                <span className="text-ink-soft">{formatDate(s.session_date)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    s.completion_status === "completed"
                      ? "bg-verde-soft text-verde-deep"
                      : "bg-line/60"
                  }`}
                >
                  {s.completion_status}
                </span>
              </div>

              {s.research_observations.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {s.research_observations.map((o) => (
                    <li key={o.id} className="text-sm">
                      <span className="font-meta text-xs uppercase text-verde mr-2">
                        {o.task_code} · {o.observation_type}
                      </span>
                      {o.note}
                    </li>
                  ))}
                </ul>
              )}

              {s.completion_status !== "completed" && (
                <>
                  <form action={addObservation} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="session_id" value={s.id} />
                    <div>
                      <label htmlFor={`task-${s.id}`} className="label">
                        Task
                      </label>
                      <input
                        id={`task-${s.id}`}
                        name="task_code"
                        type="text"
                        placeholder="create-taco"
                        className="field w-36"
                      />
                    </div>
                    <div>
                      <label htmlFor={`otype-${s.id}`} className="label">
                        Type
                      </label>
                      <select id={`otype-${s.id}`} name="observation_type" className="field">
                        <option value="note">Note</option>
                        <option value="success">Success</option>
                        <option value="failure">Failure</option>
                        <option value="confusion">Confusion</option>
                        <option value="quote">Quote</option>
                        <option value="feature_request">Feature request</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label htmlFor={`note-${s.id}`} className="label">
                        Observation
                      </label>
                      <input
                        id={`note-${s.id}`}
                        name="note"
                        type="text"
                        required
                        className="field"
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary text-sm">
                      Log
                    </button>
                  </form>
                  <form action={completeSession} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="session_id" value={s.id} />
                    <div className="flex-1 min-w-[200px]">
                      <label htmlFor={`summary-${s.id}`} className="label">
                        Session summary
                      </label>
                      <input
                        id={`summary-${s.id}`}
                        name="summary"
                        type="text"
                        className="field"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary text-sm">
                      Complete session
                    </button>
                  </form>
                </>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-ink-soft">No sessions yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
