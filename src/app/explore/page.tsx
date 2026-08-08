import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TacoCard, type TacoCardData } from "@/components/taco-card";
import { EmptyState } from "@/components/empty-state";
import type { Template } from "@/lib/core";

export const dynamic = "force-dynamic";

interface ExploreRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  published_at: string | null;
  template_id: string | null;
  users: { username: string; display_name: string; founding_status: boolean } | null;
  ingredients: { count: number }[];
  responses: { count: number }[];
  reactions: { count: number }[];
}

interface TrendingRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  published_at: string | null;
  creator_username: string;
  creator_display_name: string;
  creator_founding: boolean;
  ingredient_count: number;
  response_count: number;
  reaction_count: number;
  score: number;
}

const SORTS: { key: string; label: string; days?: number }[] = [
  { key: "new", label: "Newest" },
  { key: "week", label: "This week", days: 7 },
  { key: "month", label: "This month", days: 30 },
  { key: "featured", label: "Featured" },
];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; q?: string; sort?: string }>;
}) {
  const { template, q, sort } = await searchParams;
  const activeSort = SORTS.find((s) => s.key === sort)?.key ?? "new";
  const supabase = await createClient();

  const [{ data: templates }, { data: countData }] = await Promise.all([
    supabase.from("templates").select("*").eq("active", true).order("position"),
    supabase.rpc("get_public_taco_count"),
  ]);
  const publicCount = typeof countData === "number" ? countData : 0;

  const selectedTemplate = (templates as Template[] | null)?.find(
    (t) => t.slug === template
  );

  let cards: TacoCardData[] = [];
  const trendingSort = SORTS.find((s) => s.key === activeSort && s.days);

  if (trendingSort && !selectedTemplate && !q) {
    // Trending: scored by recent reactions, responses, and saves via RPC
    const { data } = await supabase.rpc("get_trending_tacos", {
      p_days: trendingSort.days,
      p_limit: 30,
    });
    cards = ((data ?? []) as TrendingRow[]).map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      cover_url: r.cover_url,
      published_at: r.published_at,
      creator: {
        username: r.creator_username,
        display_name: r.creator_display_name,
        founding_status: r.creator_founding,
      },
      ingredientCount: Number(r.ingredient_count),
      responseCount: Number(r.response_count),
      reactionCount: Number(r.reaction_count),
    }));
  } else {
    let query = supabase
      .from("tacos")
      .select(
        "id, slug, title, description, cover_url, published_at, template_id, users!tacos_creator_id_fkey(username, display_name, founding_status), ingredients(count), responses(count), reactions(count)"
      )
      .eq("status", "published")
      .eq("visibility", "public");

    if (selectedTemplate) query = query.eq("template_id", selectedTemplate.id);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    query =
      activeSort === "featured"
        ? query.eq("featured", true).order("published_at", { ascending: false })
        : query.order("published_at", { ascending: false });

    const { data } = await query.limit(30);
    cards = ((data ?? []) as unknown as ExploreRow[]).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      cover_url: row.cover_url,
      published_at: row.published_at,
      creator: row.users,
      ingredientCount: row.ingredients?.[0]?.count ?? 0,
      responseCount: row.responses?.[0]?.count ?? 0,
      reactionCount: row.reactions?.[0]?.count ?? 0,
    }));
  }

  const chipBase = "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all";
  const chipOn = "bg-ink text-raised border-ink";
  const chipOff = "bg-raised border-line hover:border-ink hover:-translate-y-px";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="keyline-grad mb-3" aria-hidden="true" />
      <p className="eyebrow mb-2">What&apos;s trending now</p>
      <h1 className="font-display text-2xl sm:text-4xl tracking-tight uppercase leading-tight">
        Tacos, stories &amp; <span className="text-grad-blue">taste</span>
      </h1>
      <p className="text-sm text-ink-soft mt-2">
        <span className="font-meta font-semibold text-ink">{publicCount}</span>{" "}
        public {publicCount === 1 ? "collection" : "collections"} and counting.
        No ads, no algorithm: just what the community made.
      </p>

      <div className="mt-6 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar" role="navigation" aria-label="Sort">
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={s.key === "new" ? "/explore" : `/explore?sort=${s.key}`}
            className={`${chipBase} ${activeSort === s.key && !selectedTemplate ? chipOn : chipOff}`}
          >
            {s.label}
          </Link>
        ))}
        <span className="shrink-0 self-center text-line select-none" aria-hidden="true">
          |
        </span>
        {(templates as Template[] | null)?.map((t) => (
          <Link
            key={t.id}
            href={`/explore?template=${t.slug}`}
            className={`${chipBase} ${template === t.slug ? "bg-verde text-raised border-verde" : chipOff}`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      <form action="/explore" method="get" className="mt-4 flex gap-2 max-w-md">
        <label htmlFor="explore-q" className="sr-only">
          Search Tacos
        </label>
        <input
          id="explore-q"
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search titles and descriptions"
          className="field"
        />
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      <div className="mt-8">
        {cards.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((t, i) => (
              <div key={t.id} className={i < 6 ? `anim-fade-up anim-delay-${Math.min(i % 3, 3)}` : undefined}>
                <TacoCard taco={t} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={trendingSort ? "Nothing trending yet" : "No Tacos match yet"}
            body={
              trendingSort
                ? "Trending is powered by reactions, responses, and saves. Be the reason something trends: explore the newest Tacos and react to what moves you."
                : q
                  ? `Nothing published matches "${q}". Try a broader search, or build the collection you were looking for.`
                  : "Nothing has been published with this filter yet. This is a young table; take a seat and set the first plate."
            }
            ctaHref={trendingSort ? "/explore" : "/create"}
            ctaLabel={trendingSort ? "See the newest" : "Create a Taco"}
          />
        )}
      </div>
    </div>
  );
}
