import Link from "next/link";
import { FoundingBadge } from "@/components/founding-badge";
import { timeAgo } from "@/lib/core";

export interface TacoCardData {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  status?: string;
  published_at?: string | null;
  ingredientCount?: number;
  responseCount?: number;
  reactionCount?: number;
  creator?: {
    username: string;
    display_name: string;
    founding_status: boolean;
  } | null;
}

// Curated cover fields for Tacos without an image: stable per title, drawn
// from the palette so empty covers read as designed, never as missing.
function coverGradient(title: string) {
  const fields = [
    "linear-gradient(135deg, #e7efe9 0%, #edf1fc 100%)",
    "linear-gradient(135deg, #fdf0dc 0%, #e7efe9 100%)",
    "linear-gradient(135deg, #edf1fc 0%, #fdf0dc 100%)",
    "linear-gradient(135deg, #f3ece2 0%, #e7efe9 100%)",
  ];
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return fields[h % fields.length];
}

export function TacoCard({ taco }: { taco: TacoCardData }) {
  const initial = (taco.title || "T").trim().charAt(0).toUpperCase();
  const when = timeAgo(taco.published_at);

  return (
    <Link
      href={`/t/${taco.slug}`}
      className="card group block overflow-hidden transition-all duration-200 hover:border-verde hover:shadow-lift hover:-translate-y-0.5"
    >
      <div className="aspect-[16/9] relative overflow-hidden">
        {taco.cover_url ? (
          // Covers come from user uploads and arbitrary hosts; plain img keeps the POC simple.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={taco.cover_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{ background: coverGradient(taco.title) }}
          >
            <span
              className="font-head italic font-semibold text-6xl text-ink/25 transition-transform duration-500 group-hover:scale-105 select-none"
              aria-hidden="true"
            >
              {initial}
            </span>
          </div>
        )}
        {taco.status === "draft" && (
          <span className="absolute top-2 left-2 rounded-full text-[11px] font-bold px-2 py-0.5 text-ink" style={{ background: "var(--alert)" }}>
            Draft
          </span>
        )}
        {when && (
          <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 text-raised font-meta text-[10px] px-2 py-0.5">
            {when}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-head font-semibold text-lg leading-snug group-hover:text-verde-deep transition-colors">
          {taco.title || "Untitled Taco"}
        </h3>
        {taco.description && (
          <p className="text-sm text-ink-soft mt-1 line-clamp-2">{taco.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5 min-w-0">
            {taco.creator && (
              <>
                <span className="truncate">{taco.creator.display_name}</span>
                {taco.creator.founding_status && <FoundingBadge compact />}
              </>
            )}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {typeof taco.reactionCount === "number" && taco.reactionCount > 0 && (
              <span className="chip chip-mango">{taco.reactionCount}</span>
            )}
            <span className="font-meta">
              {typeof taco.ingredientCount === "number" &&
                `${taco.ingredientCount} ingredient${taco.ingredientCount === 1 ? "" : "s"}`}
              {typeof taco.responseCount === "number" &&
                taco.responseCount > 0 &&
                ` · ${taco.responseCount} response${taco.responseCount === 1 ? "" : "s"}`}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
