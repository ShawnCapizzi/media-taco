import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { IngredientCard } from "@/components/ingredient-card";
import { FoundingBadge } from "@/components/founding-badge";
import { ShareButton } from "@/components/share-button";
import { ReactionBar } from "@/components/reaction-bar";
import { ResponseSection } from "@/components/response-section";
import { ReportForm } from "@/components/report-form";
import { createMyVersion } from "@/app/actions/tacos";
import {
  formatDate,
  type Ingredient,
  type ReactionType,
  type ResponseRow,
  type Taco,
} from "@/lib/core";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_taco_by_slug", { p_slug: slug });
  const taco = (Array.isArray(data) ? data[0] : null) as Taco | null;
  if (!taco) return { title: "Taco not found" };
  return {
    title: taco.title,
    description: taco.description || "A collection on Media Taco.",
    openGraph: {
      title: taco.title,
      description: taco.description || "A collection on Media Taco.",
      images: taco.cover_url ? [taco.cover_url] : undefined,
    },
  };
}

export default async function TacoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: tacoData } = await supabase.rpc("get_taco_by_slug", {
    p_slug: slug,
  });
  const taco = (Array.isArray(tacoData) ? tacoData[0] : null) as Taco | null;
  if (!taco) notFound();

  const [{ data: creator }, { data: ingredientsData }, { data: reactions }, { data: responses }, { data: template }] =
    await Promise.all([
      supabase
        .from("users")
        .select("username, display_name, founding_status, bio")
        .eq("id", taco.creator_id)
        .maybeSingle(),
      supabase.rpc("get_taco_ingredients", { p_taco_id: taco.id }),
      supabase.from("reactions").select("reaction_type, user_id").eq("taco_id", taco.id),
      supabase
        .from("responses")
        .select("id, user_id, taco_id, body, response_type, media_url, created_at, users(username, display_name, founding_status)")
        .eq("taco_id", taco.id)
        .eq("status", "published")
        .is("ingredient_id", null)
        .order("created_at", { ascending: true }),
      taco.template_id
        ? supabase.from("templates").select("name").eq("id", taco.template_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const ingredients = (ingredientsData ?? []) as Ingredient[];

  const reactionCounts: Record<ReactionType, number> = {
    appreciate: 0,
    relate: 0,
    tell_me_more: 0,
  };
  const myReactions = new Set<ReactionType>();
  for (const r of (reactions ?? []) as { reaction_type: ReactionType; user_id: string }[]) {
    reactionCounts[r.reaction_type] += 1;
    if (profile && r.user_id === profile.id) myReactions.add(r.reaction_type);
  }

  let saved = false;
  if (profile) {
    const { data: saveRow } = await supabase
      .from("saves")
      .select("id")
      .eq("user_id", profile.id)
      .eq("taco_id", taco.id)
      .is("ingredient_id", null)
      .maybeSingle();
    saved = !!saveRow;
  }

  const isOwner = profile?.id === taco.creator_id;
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/t/${taco.slug}`;

  await logEvent("taco_viewed", "taco", taco.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {taco.status !== "published" && (
        <div className="alert p-4 mb-6">
          <p className="text-sm">
            <strong>This is a draft.</strong> Only you can see it until you
            publish.{" "}
            <Link href={`/create?taco=${taco.id}`}>Continue editing</Link>
          </p>
        </div>
      )}
      {taco.status === "published" && taco.visibility !== "public" && (
        <div className="card p-4 mb-6">
          <p className="text-sm text-ink-soft">
            This Taco is shared by link only. It does not appear in Explore.
          </p>
        </div>
      )}

      <header>
        {(template as { name: string } | null)?.name && (
          <p className="eyebrow mb-2">{(template as { name: string }).name}</p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight leading-tight">
          {taco.title}
        </h1>
        {taco.description && (
          <p className="text-lg text-ink-soft mt-2">{taco.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-soft">
          {creator && (
            <Link
              href={`/profile/${creator.username}`}
              className="flex items-center gap-1.5 text-ink hover:text-verde"
            >
              <span className="font-medium">{creator.display_name}</span>
              {creator.founding_status && <FoundingBadge compact />}
            </Link>
          )}
          {taco.published_at && <span>{formatDate(taco.published_at)}</span>}
          <span className="font-meta text-xs">
            {ingredients.length} ingredient{ingredients.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      {taco.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={taco.cover_url}
          alt=""
          className="mt-6 w-full rounded-card border border-line object-cover max-h-[380px]"
        />
      )}

      {taco.introduction && (
        <div className="mt-8">
          <p className="eyebrow mb-2">From the creator</p>
          <p className="text-[1.02rem] leading-relaxed whitespace-pre-line">
            {taco.introduction}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <ShareButton url={shareUrl} title={taco.title} />
        {profile && !isOwner && (
          <form action={createMyVersion}>
            <input type="hidden" name="taco_id" value={taco.id} />
            <button type="submit" className="btn btn-secondary text-sm">
              Create my version
            </button>
          </form>
        )}
        {isOwner && (
          <Link href={`/create?taco=${taco.id}`} className="btn btn-secondary text-sm">
            Edit
          </Link>
        )}
      </div>

      <section className="mt-10 space-y-5" aria-label="Ingredients">
        {ingredients.map((ing) => (
          <IngredientCard key={ing.id} ingredient={ing} />
        ))}
        {ingredients.length === 0 && (
          <p className="text-sm text-ink-soft">
            No Ingredients yet. This collection is still being assembled.
          </p>
        )}
      </section>

      {taco.community_prompt && (
        <section className="card p-6 mt-10 bg-verde-soft border-verde/40">
          <p className="eyebrow mb-2">A question for you</p>
          <p className="font-display text-xl leading-snug">
            {taco.community_prompt}
          </p>
          <p className="text-sm text-ink-soft mt-2">
            Answer it in a response below, or build your own version of this
            Taco.
          </p>
        </section>
      )}

      <div className="mt-10">
        <ReactionBar
          tacoId={taco.id}
          slug={taco.slug}
          counts={reactionCounts}
          mine={Array.from(myReactions)}
          saved={saved}
          signedIn={!!profile}
        />
      </div>

      <div className="mt-10">
        <ResponseSection
          tacoId={taco.id}
          slug={taco.slug}
          responses={(responses ?? []) as unknown as ResponseRow[]}
          currentUserId={profile?.id ?? null}
        />
      </div>

      {profile && !isOwner && (
        <div className="mt-12 border-t border-line pt-6">
          <ReportForm targetType="taco" targetId={taco.id} slug={taco.slug} />
        </div>
      )}
    </div>
  );
}
