import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole } from "@/lib/auth";
import {
  createAdminInvitation,
  resolveReport,
  setTacoStatus,
  toggleFeatureTaco,
} from "@/app/actions/admin";
import { SectionHeading } from "@/components/section-heading";
import { formatDate } from "@/lib/core";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!hasRole(profile, ["moderator", "admin"])) redirect("/home");
  const isAdmin = profile.role === "admin";

  const supabase = await createClient();

  const [users, tacos, published, ingredients, responses, reactions] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("tacos").select("id", { count: "exact", head: true }),
      supabase
        .from("tacos")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("ingredients").select("id", { count: "exact", head: true }),
      supabase.from("responses").select("id", { count: "exact", head: true }),
      supabase.from("reactions").select("id", { count: "exact", head: true }),
    ]);

  const [{ data: recentTacos }, { data: openReports }, { data: invitations }] =
    await Promise.all([
      supabase
        .from("tacos")
        .select(
          "id, slug, title, status, visibility, featured, created_at, users!tacos_creator_id_fkey(username, display_name)"
        )
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("reports")
        .select(
          "id, target_type, target_id, reason, description, status, created_at, users!reports_reporter_id_fkey(username)"
        )
        .in("status", ["open", "reviewing"])
        .order("created_at"),
      isAdmin
        ? supabase
            .from("invitations")
            .select("code, role_granted, uses, max_uses, created_at")
            .order("created_at", { ascending: false })
            .limit(15)
        : Promise.resolve({ data: [] }),
    ]);

  const metrics = [
    { label: "Members", value: users.count ?? 0 },
    { label: "Tacos", value: tacos.count ?? 0 },
    { label: "Published", value: published.count ?? 0 },
    { label: "Ingredients", value: ingredients.count ?? 0 },
    { label: "Responses", value: responses.count ?? 0 },
    { label: "Reactions", value: reactions.count ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      <header>
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
          Pilot dashboard
        </h1>
      </header>

      <section>
        <SectionHeading eyebrow="Health" title="Pilot metrics" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="card p-4 text-center">
              <p className="font-display text-3xl">{m.value}</p>
              <p className="text-xs text-ink-soft mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Moderation"
          title="Open reports"
          sub={
            (openReports ?? []).length === 0
              ? "The queue is clear."
              : "Review each report and resolve or dismiss it with notes."
          }
        />
        <div className="space-y-3">
          {(openReports ?? []).map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-meta text-xs uppercase text-chile">
                  {r.reason}
                </span>
                <span>
                  {r.target_type} · reported by @
                  {(r.users as unknown as { username: string } | null)?.username ?? "unknown"}
                </span>
                <span className="text-ink-soft">{formatDate(r.created_at)}</span>
              </div>
              {r.description && (
                <p className="text-sm text-ink-soft mt-2">{r.description}</p>
              )}
              <form action={resolveReport} className="mt-3 flex flex-wrap gap-2 items-center">
                <input type="hidden" name="report_id" value={r.id} />
                <label htmlFor={`notes-${r.id}`} className="sr-only">
                  Moderator notes
                </label>
                <input
                  id={`notes-${r.id}`}
                  name="moderator_notes"
                  type="text"
                  placeholder="Moderator notes"
                  className="field max-w-xs"
                />
                <button
                  type="submit"
                  name="status"
                  value="resolved"
                  className="btn btn-primary text-sm"
                >
                  Resolve
                </button>
                <button
                  type="submit"
                  name="status"
                  value="dismissed"
                  className="btn btn-secondary text-sm"
                >
                  Dismiss
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Content"
          title="Recent Tacos"
          sub="Feature the best examples. Hide anything that breaks the standards."
        />
        <div className="space-y-2">
          {(recentTacos ?? []).map((t) => (
            <div
              key={t.id}
              className="card p-3 flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <Link
                  href={`/t/${t.slug}`}
                  className="font-medium hover:text-verde"
                >
                  {t.title || "Untitled"}
                </Link>
                <span className="text-ink-soft ml-2">
                  by @
                  {(t.users as unknown as { username: string } | null)?.username ?? "unknown"}{" "}
                  · {t.status} · {t.visibility}
                  {t.featured ? " · featured" : ""}
                </span>
              </div>
              <div className="flex gap-2">
                {t.status === "published" && t.visibility === "public" && (
                  <form action={toggleFeatureTaco}>
                    <input type="hidden" name="taco_id" value={t.id} />
                    <input type="hidden" name="featured" value={String(t.featured)} />
                    <button type="submit" className="btn btn-secondary text-xs">
                      {t.featured ? "Unfeature" : "Feature"}
                    </button>
                  </form>
                )}
                {t.status !== "hidden" ? (
                  <form action={setTacoStatus}>
                    <input type="hidden" name="taco_id" value={t.id} />
                    <input type="hidden" name="status" value="hidden" />
                    <button type="submit" className="btn btn-secondary text-xs">
                      Hide
                    </button>
                  </form>
                ) : (
                  <form action={setTacoStatus}>
                    <input type="hidden" name="taco_id" value={t.id} />
                    <input type="hidden" name="status" value="published" />
                    <button type="submit" className="btn btn-secondary text-xs">
                      Restore
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section>
          <SectionHeading
            eyebrow="Growth"
            title="Invitations"
            sub="Create codes for new members or founding contributors."
          />
          <form action={createAdminInvitation} className="flex flex-wrap gap-2 items-end mb-4">
            <div>
              <label htmlFor="inv-role" className="label">
                Role granted
              </label>
              <select id="inv-role" name="role_granted" className="field">
                <option value="member">Member</option>
                <option value="founder">Founding contributor</option>
              </select>
            </div>
            <div>
              <label htmlFor="inv-uses" className="label">
                Max uses
              </label>
              <input
                id="inv-uses"
                name="max_uses"
                type="number"
                min={1}
                max={500}
                defaultValue={1}
                className="field w-24"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Create code
            </button>
          </form>
          <div className="space-y-2">
            {(invitations ?? []).map((i) => (
              <div
                key={i.code}
                className="card p-3 flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-meta">{i.code}</span>
                <span className="text-ink-soft">
                  {i.role_granted} · {i.uses}/{i.max_uses} used
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
