import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { CreateWizard } from "@/components/create-wizard";
import type { Ingredient, Taco, Template } from "@/lib/core";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create a Taco" };

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ taco?: string; error?: string; stand?: string }>;
}) {
  const { taco: tacoId, error, stand } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(
      stand ? `/login?next=${encodeURIComponent(`/create?stand=${stand}`)}` : "/login?next=/create"
    );
  }

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .eq("active", true)
    .order("position");

  let draft: Taco | null = null;
  let ingredients: Ingredient[] = [];

  if (tacoId) {
    const { data: t } = await supabase
      .from("tacos")
      .select("*")
      .eq("id", tacoId)
      .maybeSingle();
    // RLS already restricts this to editable rows, but keep ownership explicit.
    if (t && (t as Taco).creator_id === profile.id) {
      draft = t as Taco;
      const { data: ing } = await supabase
        .from("ingredients")
        .select("*")
        .eq("taco_id", tacoId)
        .order("position");
      ingredients = (ing ?? []) as Ingredient[];
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {error && (
        <p role="alert" className="card border-chile/60 p-3 text-sm text-chile mb-6">
          {decodeURIComponent(error)}
        </p>
      )}
      <CreateWizard
        templates={(templates ?? []) as Template[]}
        draft={draft}
        initialIngredients={ingredients}
        userId={profile.id}
        standSlug={stand ?? null}
      />
    </div>
  );
}
