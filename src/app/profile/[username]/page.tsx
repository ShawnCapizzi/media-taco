import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { toggleFollow } from "@/app/actions/community";
import { TacoCard, type TacoCardData } from "@/components/taco-card";
import { FoundingBadge } from "@/components/founding-badge";
import { EmptyState } from "@/components/empty-state";
import { ProfileEditForm } from "@/components/profile-edit-form";
import type { Profile } from "@/lib/core";

export const dynamic = "force-dynamic";

interface ProfileTacoRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  status: string;
  ingredients: { count: number }[];
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const viewer = await getCurrentProfile();

  const { data: person } = await supabase
    .from("users")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!person) notFound();
  const profile = person as Profile;
  const isOwner = viewer?.id === profile.id;

  let tacoQuery = supabase
    .from("tacos")
    .select("id, slug, title, description, cover_url, status, ingredients(count)")
    .eq("creator_id", profile.id)
    .order("updated_at", { ascending: false });
  if (!isOwner) {
    tacoQuery = tacoQuery.eq("status", "published").eq("visibility", "public");
  }
  const { data: tacosData } = await tacoQuery;

  let following = false;
  if (viewer && !isOwner) {
    const { data: f } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", viewer.id)
      .eq("followed_user_id", profile.id)
      .maybeSingle();
    following = !!f;
  }

  const cards: TacoCardData[] = ((tacosData ?? []) as unknown as ProfileTacoRow[]).map(
    (t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      cover_url: t.cover_url,
      status: t.status,
      ingredientCount: t.ingredients?.[0]?.count ?? 0,
    })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="h-20 w-20 rounded-full bg-verde-soft border border-line flex items-center justify-center overflow-hidden shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-3xl text-verde" aria-hidden="true">
              {profile.display_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
              {profile.display_name}
            </h1>
            {profile.founding_status && <FoundingBadge />}
          </div>
          <p className="font-meta text-sm text-ink-soft">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-3 text-[0.98rem] leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          )}
          {profile.interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.interests.map((i) => (
                <span key={i} className="chip chip-avocado">
                  {i}
                </span>
              ))}
            </div>
          )}
          {profile.open_to_collaboration && (
            <p className="mt-3 text-sm text-verde font-medium">
              Open to collaborating on Tacos
            </p>
          )}
        </div>
        {viewer && !isOwner && (
          <form action={toggleFollow}>
            <input type="hidden" name="followed_user_id" value={profile.id} />
            <input type="hidden" name="username" value={profile.username} />
            <button
              type="submit"
              className={following ? "btn btn-secondary" : "btn btn-primary"}
            >
              {following ? "Following" : "Follow"}
            </button>
          </form>
        )}
      </header>

      {isOwner && (
        <section className="mt-10">
          <ProfileEditForm
            defaults={{
              display_name: profile.display_name,
              bio: profile.bio ?? "",
              interests: profile.interests.join(", "),
              profile_visibility: profile.profile_visibility,
              open_to_collaboration: profile.open_to_collaboration,
            }}
          />
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-4">
          {isOwner ? "My Tacos" : `Tacos by ${profile.display_name}`}
        </h2>
        {cards.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((t) => (
              <TacoCard key={t.id} taco={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={isOwner ? "Nothing here yet" : "No public Tacos yet"}
            body={
              isOwner
                ? "Your published Tacos and drafts will live here."
                : "This member has not published a public collection yet."
            }
            ctaHref={isOwner ? "/create" : undefined}
            ctaLabel={isOwner ? "Create a Taco" : undefined}
          />
        )}
      </section>
    </div>
  );
}
