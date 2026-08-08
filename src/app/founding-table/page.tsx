import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { createFounderInvite, submitFounderFeedback } from "@/app/actions/community";
import { FoundingBadge } from "@/components/founding-badge";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";
export const metadata = { title: "Founding Table" };

export default async function FoundingTablePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/founding-table");
  if (!profile.founding_status && profile.role !== "admin") redirect("/home");

  const supabase = await createClient();

  const [{ data: founders }, { data: invites }, { data: feedback }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, username, display_name, bio, interests, open_to_collaboration")
        .eq("founding_status", true)
        .order("created_at"),
      supabase
        .from("invitations")
        .select("code, invitee_email, uses, max_uses, created_at")
        .eq("inviter_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("founder_feedback")
        .select("id, topic, body, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const invitesUsed = invites?.length ?? 0;
  const invitesRemaining = profile.role === "admin" ? null : Math.max(0, 3 - invitesUsed);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-12">
      <header>
        <p className="eyebrow mb-2">Founding Table</p>
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
          The people setting this table
        </h1>
        <p className="text-sm text-ink-soft mt-2 max-w-2xl">
          Founding contributors get up to five Tacos, direct video upload,
          three invitations, and a permanent badge. In return, you shape the
          templates, the standards, and the culture everyone inherits.
        </p>
      </header>

      <section>
        <SectionHeading eyebrow="Directory" title="Founding contributors" />
        <div className="grid sm:grid-cols-2 gap-4">
          {(founders ?? []).map((f) => (
            <Link
              key={f.id}
              href={`/profile/${f.username}`}
              className="card p-4 hover:border-verde transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{f.display_name}</span>
                <FoundingBadge compact />
              </div>
              {f.bio && (
                <p className="text-sm text-ink-soft mt-1 line-clamp-2">{f.bio}</p>
              )}
              {f.open_to_collaboration && (
                <p className="text-xs text-verde mt-2 font-medium">
                  Open to collaboration
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Grow the table"
          title="Your invitations"
          sub={
            invitesRemaining === null
              ? "As an admin, you can create unlimited invitations from the admin dashboard."
              : `You can invite up to three people during the pilot. ${invitesRemaining} remaining.`
          }
        />
        <div className="space-y-2">
          {(invites ?? []).map((i) => (
            <div key={i.code} className="card p-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-meta">{i.code}</span>
              <span className="text-ink-soft">
                {i.invitee_email ? `for ${i.invitee_email} · ` : ""}
                {i.uses}/{i.max_uses} used
              </span>
            </div>
          ))}
        </div>
        {(invitesRemaining === null || invitesRemaining > 0) &&
          profile.role !== "admin" && (
            <form action={createFounderInvite} className="mt-4 flex gap-2 max-w-md">
              <label htmlFor="ft-invitee" className="sr-only">
                Invitee email (optional)
              </label>
              <input
                id="ft-invitee"
                name="invitee_email"
                type="email"
                placeholder="Invitee email (optional)"
                className="field"
              />
              <button type="submit" className="btn btn-primary whitespace-nowrap">
                Create invitation
              </button>
            </form>
          )}
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div>
          <SectionHeading
            eyebrow="Private prompts"
            title="This wave's questions"
            sub="Answer any of these inside a Taco, a response, or the feedback form."
          />
          <ul className="space-y-3 text-[0.95rem]">
            <li className="card p-4">
              Which Ingredient type did you reach for first, and which one did
              you avoid?
            </li>
            <li className="card p-4">
              Did explaining why an Ingredient mattered improve the experience
              or slow you down?
            </li>
            <li className="card p-4">
              What template is missing from the current six?
            </li>
          </ul>
        </div>
        <div>
          <SectionHeading
            eyebrow="Direct line"
            title="Send product feedback"
            sub="Goes straight to the product team. Honest criticism beats praise."
          />
          <form action={submitFounderFeedback} className="card p-4 space-y-3">
            <div>
              <label htmlFor="fb-topic" className="label">
                Topic
              </label>
              <select id="fb-topic" name="topic" className="field">
                <option value="idea">Idea</option>
                <option value="bug">Something is broken</option>
                <option value="template_suggestion">Template suggestion</option>
                <option value="community">Community</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="fb-body" className="label">
                What should we know?
              </label>
              <textarea
                id="fb-body"
                name="body"
                rows={4}
                required
                maxLength={3000}
                className="field"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Send feedback
            </button>
          </form>
          {(feedback ?? []).length > 0 && (
            <div className="mt-4">
              <p className="eyebrow mb-2">Your recent feedback</p>
              <ul className="space-y-2">
                {(feedback ?? []).map((f) => (
                  <li key={f.id} className="text-sm text-ink-soft card p-3">
                    <span className="font-meta text-xs uppercase mr-2">{f.topic}</span>
                    {f.body.slice(0, 120)}
                    {f.body.length > 120 ? "..." : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
