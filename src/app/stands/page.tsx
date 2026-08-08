import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/core";
import { YourStands } from "@/components/your-stands";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stands" };

interface StandRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  event_on: string | null;
  created_at: string;
  creator_username: string;
  creator_display_name: string;
  taco_count: number;
}

export default async function StandsPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_stands", { p_limit: 24 });
  const stands = (data ?? []) as StandRow[];

  return (
    <div className="stand-world">
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="keyline-grad mb-3" aria-hidden="true" />
      <p className="eyebrow stand-eyebrow mb-2">Group collections</p>
      <h1 className="font-head font-semibold text-3xl sm:text-5xl tracking-tight leading-[1.05]">
        Stands
      </h1>
      <p className="text-sm text-ink-soft mt-2 max-w-2xl">
        A Stand is a shared shelf: one event, trip, or moment, filled with
        everyone&apos;s own Tacos. Vacations, birthdays, shows, the work
        offsite nobody will shut up about.
      </p>
      <Link href="/stands/new" className="btn btn-primary mt-5">
        Open a Stand
      </Link>

      <div className="mt-10">
        <YourStands />
      </div>

      <div className="mt-10">
        <div className="keyline-grad mb-2" aria-hidden="true" />
        <p className="eyebrow mb-1">Discover</p>
        <h2 className="font-display text-xl sm:text-2xl tracking-tight mb-4">
          Public Stands
        </h2>
        {stands.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stands.map((s) => (
              <Link
                key={s.id}
                href={`/s/${s.slug}`}
                className="card group block p-5 transition-all duration-200 hover:border-verde hover:shadow-lift hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="chip chip-blue">
                    {s.taco_count} {Number(s.taco_count) === 1 ? "Taco" : "Tacos"}
                  </span>
                  {s.event_on && (
                    <span className="font-meta text-[11px] text-ink-soft">
                      {formatDate(s.event_on + "T00:00:00")}
                    </span>
                  )}
                </div>
                <h2 className="font-head font-semibold text-lg leading-snug mt-3 group-hover:text-verde-deep transition-colors">
                  {s.title}
                </h2>
                {s.description && (
                  <p className="text-sm text-ink-soft mt-1 line-clamp-2">{s.description}</p>
                )}
                <p className="text-xs text-ink-soft mt-3">
                  Opened by {s.creator_display_name}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No public Stands yet"
            body="Open the first one: a night, a trip, a party, and let everyone bring their own Taco to it."
            ctaHref="/stands/new"
            ctaLabel="Open a Stand"
          />
        )}
      </div>
    </div>
    </div>
  );
}
