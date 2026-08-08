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
  const description =
    stand.description ||
    "A shared shelf on Media Taco: everyone adds their own small collection.";
  return {
    title: stand.title,
    description,
    openGraph: {
      title: `${stand.title} · Media Taco`,
      description: `${description} Tap through to add your own Taco.`,
      type: "website",
      siteName: "Media Taco",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/s/${slug}`,
    },
  };
}

export default async function StandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string; added?: string }>;
}) {
  const { slug } = await params;
  const { code, added } = await searchParams;
  const codeQuery = code ? `code=${encodeURIComponent(code)}&` : "";
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
    <div className="stand-world -mt-0">
      <div className="mx-auto max-w-6xl px-4 py-10">
      {added === "1" && (
        <div className="alert p-4 mb-6">
          <p className="text-sm">
            <strong>Your Taco is on the Stand.</strong> Welcome to the shelf.
            React to the others while you are here.
          </p>
        </div>
      )}

      {stand.visibility !== "public" && (
        <div className="card p-3 mb-6 text-sm text-ink-soft">
          This Stand is {stand.visibility === "link" ? "shared by link only" : `${stand.visibility} visibility`}.
        </div>
      )}

      <div className="keyline-grad mb-3" aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow stand-eyebrow mb-2 flex items-center gap-3">
            <span>
              A Stand{stand.event_on ? ` · ${formatDate(stand.event_on + "T00:00:00")}` : ""}
            </span>
            <LiveRefresher seconds={15} />
          </p>
          <h1 className="font-head font-semibold text-3xl sm:text-5xl tracking-tight leading-[1.05]">
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
        <div className="flex items-center gap-2.5 shrink-0">
          <InviteToStand url={shareUrl} standTitle={stand.title} />
          <ShareButton url={shareUrl} title={stand.title} />
        </div>
      </div>

      {canContribute && (
        <section className="card p-6 sm:p-7 mt-8 rounded-2xl">
          <h2 className="font-head font-semibold text-xl sm:text-2xl tracking-tight">
            Add your Taco to this Stand
          </h2>
          <p className="text-[15px] text-ink-soft mt-1.5">
            Everyone brings their own.
          </p>

          <div className="mt-5">
            <Link
              href={`/create?stand=${stand.slug}`}
              className="btn btn-primary w-full sm:w-auto"
            >
              Build a new Taco for this Stand
            </Link>
            <p className="text-sm text-ink-soft mt-2">
              It lands here automatically when you publish.
            </p>
          </div>

          {myUnattached.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="font-meta text-[11px] uppercase tracking-widest text-ink-soft mb-1">
                Or add one you already made
              </p>
              <ul>
                {myUnattached.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-4 py-2.5 border-b border-line last:border-b-0"
                  >
                    <span className="min-w-0 truncate text-[15px]">
                      {t.title || "Untitled"}
                      {t.status === "draft" && (
                        <span className="text-ink-soft text-sm"> · draft</span>
                      )}
                    </span>
                    <form action={attachTacoToStand} className="shrink-0">
                      <input type="hidden" name="stand_id" value={stand.id} />
                      <input type="hidden" name="taco_id" value={t.id} />
                      <input type="hidden" name="slug" value={stand.slug} />
                      <button type="submit" className="btn btn-secondary btn-sm">
                        Add
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-soft mt-2">
                Drafts stay visible only to you until you publish them.
              </p>
            </div>
          )}
        </section>
      )}

      {!profile && (
        <section className="card p-6 sm:p-8 mt-8 border-2 bg-raised" style={{ borderColor: "var(--blue)" }}>
          <div className="keyline-grad mb-3" aria-hidden="true" />
          <p className="eyebrow stand-eyebrow mb-2">This is a Stand: a shared shelf</p>
          <h2 className="font-head font-semibold text-2xl sm:text-3xl tracking-tight leading-snug">
            Were you there? Add your own Taco to this Stand.
          </h2>
          <p className="text-base text-ink-soft mt-3 max-w-xl leading-relaxed">
            Everyone who was part of it adds their own small collection: a
            photo, the song that was playing, the line that stuck, and why it
            mattered. Side by side, that becomes the memory of the whole
            thing. No ads, no algorithm.
          </p>
          <ol className="mt-5 space-y-3 text-base max-w-xl">
            <li className="flex gap-2">
              <span className="font-display text-grad-blue shrink-0" aria-hidden="true">01</span>
              <span>Join in about 30 seconds. An email and a birth year (13 and up).</span>
            </li>
            <li className="flex gap-2">
              <span className="font-display text-grad-blue shrink-0" aria-hidden="true">02</span>
              <span>Build your quick Taco of it: one photo, one song, one line is plenty.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-display text-grad-blue shrink-0" aria-hidden="true">03</span>
              <span>It lands right here, next to everyone else&apos;s.</span>
            </li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/join?${codeQuery}next=${encodeURIComponent(`/s/${stand.slug}`)}`}
              className="btn btn-primary text-base px-6 py-3"
            >
              Join and add your Taco
            </Link>
            <Link
              href={`/login?next=${encodeURIComponent(`/s/${stand.slug}`)}`}
              className="btn btn-secondary text-base px-6 py-3"
            >
              I am already a member
            </Link>
          </div>
          <p className="text-sm text-ink-soft mt-3">
            Takes about two minutes. Free, no ads, 13 and up.
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
            <Link href={`/create?stand=${stand.slug}`} className="btn btn-primary mt-4">
              Create a Taco for this Stand
            </Link>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
