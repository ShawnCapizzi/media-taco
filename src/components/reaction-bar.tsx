import Link from "next/link";
import { toggleReaction, toggleSave } from "@/app/actions/community";
import { REACTIONS, type ReactionType } from "@/lib/core";

export function ReactionBar({
  tacoId,
  slug,
  counts,
  mine,
  saved,
  signedIn,
}: {
  tacoId: string;
  slug: string;
  counts: Record<ReactionType, number>;
  mine: ReactionType[];
  saved: boolean;
  signedIn: boolean;
}) {
  const mineSet = new Set(mine);

  return (
    <div className="card p-4">
      <p className="eyebrow mb-3">Respond in a way that means something</p>
      <div className="flex flex-wrap items-center gap-2">
        {REACTIONS.map((r) => {
          const active = {
            appreciate: "bg-verde text-raised border-verde",
            relate: "bg-mango-deep text-raised border-mango-deep",
            tell_me_more: "bg-blue text-raised border-blue",
          }[r.value];
          const hover = {
            appreciate: "hover:border-verde",
            relate: "hover:border-mango",
            tell_me_more: "hover:border-blue",
          }[r.value];
          return (
          <form key={r.value} action={toggleReaction}>
            <input type="hidden" name="taco_id" value={tacoId} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="reaction_type" value={r.value} />
            <button
              type="submit"
              aria-pressed={mineSet.has(r.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                mineSet.has(r.value) ? active : `border-line ${hover}`
              }`}
            >
              {r.label}
              {counts[r.value] > 0 && (
                <span className="ml-1.5 font-meta text-xs opacity-80">
                  {counts[r.value]}
                </span>
              )}
            </button>
          </form>
          );
        })}
        <form action={toggleSave}>
          <input type="hidden" name="taco_id" value={tacoId} />
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            aria-pressed={saved}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              saved
                ? "bg-ink text-raised border-ink"
                : "border-line hover:border-ink"
            }`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </form>
      </div>
      {!signedIn && (
        <p className="help mt-3">
          <Link href={`/login?next=/t/${slug}`} className="text-verde underline underline-offset-2">
            Sign in
          </Link>{" "}
          to react, save, or respond.
        </p>
      )}
    </div>
  );
}
