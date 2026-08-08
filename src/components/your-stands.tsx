import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { formatDate } from "@/lib/core";

interface MyStandRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_on: string | null;
  visibility: string;
  is_owner: boolean;
  taco_count: number;
  my_taco_count: number;
}

// Shows the Stands the signed-in person created or added a Taco to.
// Renders nothing for signed-out users or those not in any Stand.
export async function YourStands({ heading = true }: { heading?: boolean }) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_my_stands");
  const stands = (data ?? []) as MyStandRow[];
  if (stands.length === 0) return null;

  return (
    <section aria-label="Your Stands">
      {heading && (
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <div className="keyline-grad mb-2" aria-hidden="true" />
            <p className="eyebrow mb-1">Yours</p>
            <h2 className="font-head font-semibold text-2xl sm:text-3xl tracking-tight">Your Stands</h2>
          </div>
          <Link href="/stands/new" className="btn btn-secondary text-sm whitespace-nowrap">
            Open a Stand
          </Link>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stands.map((s) => (
          <Link
            key={s.id}
            href={`/s/${s.slug}`}
            className="card group block p-4 transition-all duration-200 hover:border-verde hover:shadow-lift hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`chip ${s.is_owner ? "chip-mango" : "chip-blue"}`}>
                {s.is_owner ? "You opened this" : "You are in this"}
              </span>
              {s.event_on && (
                <span className="font-meta text-[11px] text-ink-soft">
                  {formatDate(s.event_on + "T00:00:00")}
                </span>
              )}
            </div>
            <h3 className="font-head font-semibold text-lg leading-snug mt-2 group-hover:text-verde-deep transition-colors">
              {s.title}
            </h3>
            <p className="text-xs text-ink-soft mt-2">
              {s.taco_count} {Number(s.taco_count) === 1 ? "Taco" : "Tacos"}
              {Number(s.my_taco_count) > 0 && ` · ${s.my_taco_count} yours`}
              {s.visibility !== "public" && ` · ${s.visibility}`}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
