import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { attachTacoToStand, detachTacoFromStand } from "@/app/actions/stands";
import { TacoCard, type TacoCardData } from "@/components/taco-card";
import { ShareButton } from "@/components/share-button";
import { LiveRefresher } from "@/components/live-refresher";
import { InviteToStand } from "@/components/invite-to-stand";
import { formatDate } from "@/lib/core";

export const dynamic = "force-dynamic";

interface Stand {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string;
  visibility: string;
  status: string;
  open_contributions: boolean;
  event_on: string | null;
}

interface StandTacoRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  status: string;
  published_at: string | null;
  attached_at: string;
  creator_username: string;
  creator_display_name: string;
  creator_founding: boolean;
  ingredient_count: number;
  reaction_count: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_stand_by_slug", { p_slug: slug });
  const stand = (Array.isArray(data) ? data[0] : null) as Stand | null;
  if (!stand) return { title: "Stand not found" };
  return {
    title: stand.title,
    description: stand.description || "A shared Stand on Media Taco.",
  };
}

export default async function StandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: standData } = await supabase.rpc("get_stand_by_slug", {
    p_slug: slug,
  });
  const stand = (Array.isArray(standData) ? standData[0] : null) as Stand | null;
  if (!stand) notFound();

  const [{ data: tacosData }, { data: creator }] = await Promise.all([
    supabase.rpc("get_stand_tacos", { p_stand_id: stand.id }),
    supabase
      .from("users")
      .select("username, display_name")
      .eq("id", stand.creator_id)
      .maybeSingle(),
  ]);

  const rows = (tacosData ?? []) as StandTacoRow[];
  const attachedIds = new Set(rows.map((r) => r.id));
  const isOwner = profile?.id === stand.creator_id;
  const canContribute = !!profile && (stand.open_contributions || isOwner);

  let myUnattached: { id: string; title: string; status: string }[] = [];
  if (canContribute) {
    const { data: mine } = await supabase
      .from("tacos")
      .select("id, title, status")
      .eq("creator_id", profile!.id)
      .order("updated_at", { ascending: false });
    myUnattached = ((mine ?? []) as { id: string; title: string; status: string }[]).filter(
      (t) => !attachedIds.has(t.id)
    );
  }

  const cards: TacoCardData[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    cover_url: r.cover_url,
    status: r.status,
    published_at: r.published_at,
    creator: {
      username: r.creator_username,
      display_name: r.creator_display_name,
      founding_status: r.creator_founding,
    },
    ingredientCount: Number(r.ingredient_count),
    reactionCount: Number(r.reaction_count),
  }));

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/s/${stand.slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {stand.visibility !== "public" && (
        <div className="card p-3 mb-6 text-sm text-ink-soft">
          This Stand is {stand.visibility === "link" ? "shared by link only" : `${stand.visibility} visibility`}.
        </div>
      )}

      <div className="keyline-grad mb-3" aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">
            A Stand{stand.event_on ? ` · ${formatDate(stand.event_on + "T00:00:00")}` : ""}
          </p>
          <h1 className="font-display text-2xl sm:text-4xl tracking-tight leading-tight">
            {stand.title}
          </h1>
          {stand.description && (
            <p className="text-ink-soft mt-2 max-w-2xl">{stand.description}</p>
          )}
          <p className="text-xs text-ink-soft mt-2">
            Opened by{" "}
            {creator ? (
              <Link
                href={`/profile/${creator.username}`}
                className="text-verde underline underline-offset-2"
              >
                {creator.display_name}
              </Link>
            ) : (
              "a member"
            )}
            {" · "}
            {cards.length} {cards.length === 1 ? "Taco" : "Tacos"} on the Stand
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LiveRefresher seconds={15} />
          <ShareButton url={shareUrl} title={stand.title} />
          <InviteToStand
            url={shareUrl}
            standTitle={stand.title}
          />
        </div>
      </div>

      {canContribute && (
        <section className="card p-6 mt-8 border-2 border-verde bg-verde-soft/60 anim-fade-up">
          <div className="keyline-grad mb-2" aria-hidden="true" />
          <h2 className="font-display text-lg sm:text-xl">Add your Taco to this Stand</h2>
          <p className="text-sm text-ink-soft mt-1">
            Everyone brings their own. Pick a Taco you already made, or build a
            new one for this Stand.
          </p>
          <div className="mt-3" />
          {myUnattached.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {myUnattached.map((t) => (
                <form key={t.id} action={attachTacoToStand}>
                  <input type="hidden" name="stand_id" value={stand.id} />
                  <input type="hidden" name="taco_id" value={t.id} />
                  <input type="hidden" name="slug" value={stand.slug} />
                  <button type="submit" className="btn btn-secondary text-sm">
                    + {t.title || "Untitled"}
                    {t.status === "draft" ? " (draft)" : ""}
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft mt-2">
              {attachedIds.size > 0 && rows.some((r) => r.creator_username === profile?.username)
                ? "Your Taco is on the Stand."
                : "You have no Tacos yet."}
            </p>
          )}
          <p className="help mt-3">
            Drafts you add stay visible only to you until you publish them.{" "}
            <Link href="/create" className="text-verde underline underline-offset-2">
              Build a new Taco
            </Link>{" "}
            for this Stand.
          </p>
        </section>
      )}

      {!profile && (
        <section className="card p-5 mt-8">
          <p className="text-sm">
            <Link
              href={`/login?next=/s/${stand.slug}`}
              className="text-verde underline underline-offset-2 font-medium"
            >
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/join" className="text-verde underline underline-offset-2 font-medium">
              join
            </Link>{" "}
            to add your own Taco to this Stand.
          </p>
        </section>
      )}

      <section className="mt-8">
        {cards.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((t) => (
              <div key={t.id}>
                <TacoCard taco={t} />
                {(isOwner || t.creator?.username === profile?.username) && (
                  <form action={detachTacoFromStand} className="mt-1 text-right">
                    <input type="hidden" name="stand_id" value={stand.id} />
                    <input type="hidden" name="taco_id" value={t.id} />
                    <input type="hidden" name="slug" value={stand.slug} />
                    <button
                      type="submit"
                      className="text-xs text-ink-soft hover:text-chile underline underline-offset-2"
                    >
                      Remove from Stand
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <h2 className="font-display text-lg">The Stand is open</h2>
            <p className="text-sm text-ink-soft mt-2 max-w-md mx-auto">
              No Tacos yet. Build yours and be the first plate on the table.
            </p>
            <Link href="/create" className="btn btn-primary mt-4">
              Create a Taco
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
