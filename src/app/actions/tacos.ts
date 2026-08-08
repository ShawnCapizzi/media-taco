"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";
import { slugify, type Visibility } from "@/lib/core";

export interface DraftPayload {
  id?: string;
  template_id?: string | null;
  title: string;
  description: string;
  introduction: string;
  cover_url?: string | null;
  community_prompt?: string | null;
  visibility: Visibility;
}

export type DraftResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

export async function saveTacoDraft(payload: DraftPayload): Promise<DraftResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to create a Taco." };

  const clean = {
    template_id: payload.template_id ?? null,
    title: payload.title.slice(0, 120),
    description: payload.description.slice(0, 300),
    introduction: payload.introduction.slice(0, 4000),
    cover_url: payload.cover_url || null,
    community_prompt: payload.community_prompt?.slice(0, 300) || null,
    visibility: payload.visibility,
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("tacos")
      .update(clean)
      .eq("id", payload.id)
      .select("id, slug")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Draft could not be saved." };
    return { ok: true, id: data.id, slug: data.slug };
  }

  const { data, error } = await supabase
    .from("tacos")
    .insert({
      ...clean,
      creator_id: user.id,
      slug: slugify(payload.title || "untitled"),
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Draft could not be created." };
  }

  await logEvent("taco_created", "taco", data.id, {
    template_selected: !!payload.template_id,
  });
  return { ok: true, id: data.id, slug: data.slug };
}

export async function publishTaco(tacoId: string): Promise<DraftResult> {
  const supabase = await createClient();
  const { data: taco } = await supabase
    .from("tacos")
    .select("id, slug, title, visibility")
    .eq("id", tacoId)
    .single();
  if (!taco) return { ok: false, error: "Taco not found." };
  if (!taco.title.trim()) return { ok: false, error: "Give your Taco a title before publishing." };

  const { count } = await supabase
    .from("ingredients")
    .select("id", { count: "exact", head: true })
    .eq("taco_id", tacoId);
  if (!count || count < 1) {
    return { ok: false, error: "Add at least one Ingredient before publishing." };
  }

  const { error } = await supabase
    .from("tacos")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      visibility: taco.visibility === "private" ? "link" : taco.visibility,
    })
    .eq("id", tacoId);
  if (error) return { ok: false, error: error.message };

  await logEvent("taco_published", "taco", tacoId, { ingredient_count: count });
  revalidatePath("/home");
  revalidatePath("/explore");
  return { ok: true, id: tacoId, slug: taco.slug };
}

export async function unpublishTaco(tacoId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tacos").update({ status: "draft" }).eq("id", tacoId);
  await logEvent("taco_unpublished", "taco", tacoId);
  revalidatePath("/explore");
  revalidatePath("/home");
}

export async function deleteTaco(tacoId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tacos").delete().eq("id", tacoId);
  await logEvent("taco_deleted", "taco", tacoId);
  revalidatePath("/home");
  redirect("/home");
}

// Create-my-version: clones the template, title, and prompt with attribution,
// never the original creator's Ingredients or personal content.
export async function createMyVersion(formData: FormData): Promise<void> {
  const sourceTacoId = String(formData.get("taco_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/explore");

  const { data: origin } = await supabase
    .from("tacos")
    .select("id, title, template_id, community_prompt")
    .eq("id", sourceTacoId)
    .maybeSingle();

  if (!origin) redirect("/explore");

  const { data, error } = await supabase
    .from("tacos")
    .insert({
      creator_id: user!.id,
      template_id: origin!.template_id,
      title: `My version: ${origin!.title}`.slice(0, 120),
      slug: slugify(`my-version-${origin!.title}`),
      community_prompt: origin!.community_prompt,
      inspired_by_taco_id: origin!.id,
      status: "draft",
      visibility: "private",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/create?error=${encodeURIComponent(error?.message ?? "Could not create your version.")}`
    );
  }

  await logEvent("create_my_version_selected", "taco", data!.id, {
    inspired_by: origin!.id,
  });
  redirect(`/create?taco=${data!.id}`);
}
