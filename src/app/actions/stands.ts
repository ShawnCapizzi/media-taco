"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";
import { slugify } from "@/lib/core";

export async function createStand(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/stands/new");

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 300);
  const visibility = String(formData.get("visibility") ?? "community");
  const eventOn = String(formData.get("event_on") ?? "").trim() || null;
  const openContributions = formData.get("open_contributions") !== "off";

  if (!title) redirect("/stands/new?error=" + encodeURIComponent("Give your Stand a name."));
  if (!["private", "link", "community", "public"].includes(visibility)) {
    redirect("/stands/new?error=" + encodeURIComponent("Choose a valid visibility."));
  }

  const { data, error } = await supabase
    .from("stands")
    .insert({
      creator_id: user!.id,
      title,
      slug: slugify(title),
      description,
      visibility,
      event_on: eventOn,
      open_contributions: openContributions,
    })
    .select("slug")
    .single();

  if (error || !data) {
    redirect("/stands/new?error=" + encodeURIComponent(error?.message ?? "Could not create the Stand."));
  }

  await logEvent("stand_created", "stand", undefined);
  redirect(`/s/${data!.slug}`);
}

export async function attachTacoToStand(formData: FormData): Promise<void> {
  const standId = String(formData.get("stand_id") ?? "");
  const tacoId = String(formData.get("taco_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/s/${slug}`);

  // RLS enforces: your own Taco only, open Stand or your Stand.
  const { error } = await supabase.from("stand_tacos").insert({
    stand_id: standId,
    taco_id: tacoId,
    added_by: user!.id,
  });
  if (!error) await logEvent("taco_added_to_stand", "stand", standId);
  revalidatePath(`/s/${slug}`);
}

export async function detachTacoFromStand(formData: FormData): Promise<void> {
  const standId = String(formData.get("stand_id") ?? "");
  const tacoId = String(formData.get("taco_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = await createClient();
  await supabase
    .from("stand_tacos")
    .delete()
    .eq("stand_id", standId)
    .eq("taco_id", tacoId);
  revalidatePath(`/s/${slug}`);
}

export async function deleteStand(formData: FormData): Promise<void> {
  const standId = String(formData.get("stand_id") ?? "");
  const supabase = await createClient();
  await supabase.from("stands").delete().eq("id", standId);
  await logEvent("stand_deleted", "stand", standId);
  redirect("/stands");
}
