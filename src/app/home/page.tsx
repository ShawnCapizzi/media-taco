import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { TacoCard, type TacoCardData } from "@/components/taco-card";
import { SectionHeading } from "@/components/section-heading";
import { EmptyState } from "@/components/empty-state";
import { YourStands } from "@/components/your-stands";

export const dynamic = "force-dynamic";

interface TacoRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  status: string;
  community_prompt: string | null;
  users: { username: string; display_name: string; founding_status: boolean } | null;
  ingredients: { count: number }[];
}

function toCard(row: TacoRow): TacoCardData {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    cover_url: row.cover_url,
    status: row.status,
    creator: row.users,
    ingredientCount: row.ingredients?.[0]?.count ?? 0,
  };
}

const TACO_SELECT =
  "id, slug, title, description, cover_url, status, community_prompt, users!tacos_creator_id_fkey(username, display_name, founding_status), ingredients(count)";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/home");
  const { welcome } = await searchParams;

  const supabase = await createClient();

  const [featuredRes, foundingRes, promptRes, mineRes] = await Promise.all([
    supabase
      .from("tacos")
      .select(TACO_SELECT)
      .eq("status", "published")
      .eq("visibility", "public")
      .eq("featured", true)
      .order("published_at", { ascending: false })
      .limit(6),
    supabase
      .from("tacos")
      .select(TACO_SELECT)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("published_at", { ascending: false })
      .limit(6),
    supabase
      .from("tacos")
      .select(TACO_SELECT)
      .eq("status", "published")
      .eq("visibility", "public")
      .not("community_prompt", "is", null)
      .order("published_at", { ascending: false })
      .limit(1),
    supabase
      .from("tacos")
      .select(TACO_SELECT)
      .eq("creator_id", profile.id)
      .order("updated_at", { ascending: false }),
  ]);

  const featured = ((featuredRes.data ?? []) as unknown as TacoRow[]).map(toCard);
  const founding = ((foundingRes.data ?? []) as unknown as TacoRow[])
    .filter((t) => t.users?.founding_status)
    .map(toCard);
  const promptTaco = ((promptRes.data ?? []) as unknown as TacoRow[])[0];
  const mine = ((mineRes.data ?? []) as unknown as TacoRow[]).map(toCard);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      {welcome && (
        <div className="card p-5 border-verde bg-verde-soft">
          <h2 className="font-display text-lg">
            Welcome to the table, {profile.display_name}.
          </h2>
          <p className="text-sm text-ink-soft mt-1">
            Start by exploring a few Tacos to see how contributors use context,
            then build your first one. A Taco is a collection; an Ingredient is
            one meaningful thing inside it, plus the reason it belongs.
          </p>
        </div>
      )}

      <section>
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Curated"
            title="Featured Tacos"
            sub="Hand-picked collections that show what Media Taco is for."
          />
          <Link href="/explore" className="text-sm text-verde underline underline-offset-2 whitespace-nowrap mb-5">
            See all
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((t) => (
              <TacoCard key={t.id} taco={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing featured yet"
            body="Featured Tacos appear here once the community publishes its first collections."
            ctaHref="/create"
            ctaLabel="Start the first one"
          />
        )}
      </section>

      {promptTaco?.community_prompt && (
        <section className="card p-6">
          <p className="eyebrow mb-2">Respond to a prompt</p>
          <blockquote className="font-display text-2xl leading-snug max-w-2xl">
            {promptTaco.community_prompt}
          </blockquote>
          <p className="text-sm text-ink-soft mt-2">
            Asked by {promptTaco.users?.display_name} in{" "}
            <Link
              href={`/t/${promptTaco.slug}`}
              className="text-verde underline underline-offset-2"
            >
              {promptTaco.title}
            </Link>
          </p>
        </section>
      )}

      {founding.length > 0 && (
        <section>
          <SectionHeading
            eyebrow="Founding Table"
            title="New from the founding contributors"
            sub="The 8 to 12 people building this community from the first bite."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {founding.map((t) => (
              <TacoCard key={t.id} taco={t} />
            ))}
          </div>
        </section>
      )}

      <YourStands />

      <section>
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Group collections"
            title="Stands"
            sub="Shared shelves: a trip, a party, a night. Everyone brings their own Taco."
          />
          <Link
            href="/stands"
            className="text-sm text-verde underline underline-offset-2 whitespace-nowrap mb-5"
          >
            Browse all
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 -mt-1 mb-2">
          <Link href="/stands/new" className="btn btn-secondary text-sm">
            Open a Stand
          </Link>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Yours"
          title="My Tacos"
          sub="Drafts stay private until you publish them."
        />
        {mine.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mine.map((t) => (
              <TacoCard key={t.id} taco={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Start your first Taco"
            body="Build a collection around something you care about. Add the photos, songs, places, and stories that belong in it, and tell people why they matter."
            ctaHref="/create"
            ctaLabel="Create a Taco"
          />
        )}
      </section>
    </div>
  );
}
