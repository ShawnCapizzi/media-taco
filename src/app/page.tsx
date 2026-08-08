import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TacoCard, type TacoCardData } from "@/components/taco-card";
import { SectionHeading } from "@/components/section-heading";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  const { data: featured } = await supabase
    .from("tacos")
    .select(
      "id, slug, title, description, cover_url, users!tacos_creator_id_fkey(username, display_name, founding_status), ingredients(count)"
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(3);

  const cards: TacoCardData[] = (featured ?? []).map((t) => {
    const row = t as unknown as {
      id: string;
      slug: string;
      title: string;
      description: string;
      cover_url: string | null;
      users: { username: string; display_name: string; founding_status: boolean } | null;
      ingredients: { count: number }[];
    };
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      cover_url: row.cover_url,
      creator: row.users,
      ingredientCount: row.ingredients?.[0]?.count ?? 0,
    };
  });

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24">
        <p className="eyebrow mb-4 anim-fade-up">A collections-first community</p>
        <h1 className="font-display text-3xl sm:text-5xl leading-[1.12] tracking-tight max-w-4xl anim-fade-up anim-delay-1">
          Share more than a post. Show people{" "}
          <span className="text-grad-blue">why it matters.</span>
        </h1>
        <p className="mt-6 text-lg text-ink-soft max-w-2xl leading-relaxed anim-fade-up anim-delay-2">
          Media Taco helps you turn the songs, images, memories, places,
          stories, and creative work that shape you into collections people can
          understand and respond to.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 anim-fade-up anim-delay-3">
          <Link href="/explore" className="btn btn-primary">
            Explore the first Tacos
          </Link>
          <Link href="/join" className="btn btn-secondary">
            Join the community
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-raised/70">
        <div className="mx-auto max-w-6xl px-4 py-8 grid sm:grid-cols-3 gap-6">
          <div>
            <p className="font-display text-sm text-verde">No ads. Ever.</p>
            <p className="text-sm text-ink-soft mt-1">
              Nothing here is sponsored, promoted, or paid to reach you.
            </p>
          </div>
          <div>
            <p className="font-display text-sm text-mango-deep">No algorithm.</p>
            <p className="text-sm text-ink-soft mt-1">
              No feed deciding what you see. Collections, chosen on purpose.
            </p>
          </div>
          <div>
            <p className="font-display text-sm text-blue">Yours stays yours.</p>
            <p className="text-sm text-ink-soft mt-1">
              You choose who sees each Taco. Linked media stays on its
              original platform.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading
          eyebrow="How it works"
          title="A Taco is a collection. An Ingredient is one meaningful thing inside it."
          sub="You are not posting for a feed. You are building something people can understand, keep, respond to, or build their own version of."
        />
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="eyebrow mb-2">Step one</p>
            <h3 className="font-display text-lg">Pick what to build</h3>
            <p className="text-sm text-ink-soft mt-2">
              Explain something about yourself, preserve a memory, share your
              taste, show your creative work, or capture a place worth knowing.
            </p>
          </div>
          <div className="card p-5">
            <p className="eyebrow mb-2">Step two</p>
            <h3 className="font-display text-lg">Add Ingredients with context</h3>
            <p className="text-sm text-ink-soft mt-2">
              Photos, songs, places, quotes, stories, and creative work. Every
              Ingredient carries the reason it belongs, and the reason is the
              point.
            </p>
          </div>
          <div className="card p-5">
            <p className="eyebrow mb-2">Step three</p>
            <h3 className="font-display text-lg">Share it with people who get it</h3>
            <p className="text-sm text-ink-soft mt-2">
              Publish publicly, share by private link, or keep it for
              yourself. People can respond, save Ingredients, or create their
              own version.
            </p>
          </div>
        </div>
      </section>

      {cards.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 border-t border-line">
          <SectionHeading
            eyebrow="From the Founding Table"
            title="The first Tacos"
            sub="Built by the founding contributors who are shaping this community."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((t) => (
              <TacoCard key={t.id} taco={t} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 border-t border-line text-center">
        <h2 className="font-display text-3xl">Become a founding contributor</h2>
        <p className="text-ink-soft mt-3 max-w-xl mx-auto">
          The first 8 to 12 members are not testers. They set the table for
          everyone who comes after. Media Taco is for people 13 and older.
        </p>
        <Link href="/join" className="btn btn-primary mt-6">
          Request your seat
        </Link>
      </section>
    </div>
  );
}
