"use server";

import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";
import { INGREDIENT_TYPES, type Ingredient, type IngredientMetadata, type IngredientType } from "@/lib/core";

export interface IngredientPayload {
  id?: string;
  taco_id: string;
  type: IngredientType;
  title: string;
  description: string;
  why_it_matters: string;
  media_url?: string | null;
  external_url?: string | null;
  alt_text?: string | null;
  attribution?: string | null;
  location_name?: string | null;
  happened_on?: string | null;
  position: number;
  visibility?: "inherit" | "private";
  metadata?: IngredientMetadata | null;
}

export type IngredientResult =
  | { ok: true; ingredient: Ingredient }
  | { ok: false; error: string };

const VALID_TYPES = new Set(INGREDIENT_TYPES.map((t) => t.value));

export async function upsertIngredient(
  payload: IngredientPayload
): Promise<IngredientResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to add Ingredients." };
  if (!VALID_TYPES.has(payload.type)) {
    return { ok: false, error: "Choose a supported Ingredient type." };
  }
  if (!payload.title.trim()) {
    return { ok: false, error: "Give this Ingredient a title." };
  }

  const clean = {
    type: payload.type,
    title: payload.title.slice(0, 120),
    description: payload.description.slice(0, 2000),
    why_it_matters: payload.why_it_matters.slice(0, 1000),
    media_url: payload.media_url || null,
    external_url: payload.external_url || null,
    alt_text: payload.alt_text?.slice(0, 300) || null,
    attribution: payload.attribution?.slice(0, 200) || null,
    location_name: payload.location_name?.slice(0, 160) || null,
    happened_on: payload.happened_on || null,
    position: payload.position,
    visibility: payload.visibility ?? "inherit",
    metadata_json: payload.metadata ?? {},
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("ingredients")
      .update(clean)
      .eq("id", payload.id)
      .select("*")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message ?? "Ingredient could not be saved." };
    }
    return { ok: true, ingredient: data as Ingredient };
  }

  const { data, error } = await supabase
    .from("ingredients")
    .insert({ ...clean, taco_id: payload.taco_id, creator_id: user.id })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Ingredient could not be added." };
  }

  await logEvent("ingredient_added", "ingredient", data.id, {
    ingredient_type: payload.type,
    has_context: payload.why_it_matters.trim().length > 0,
  });
  return { ok: true, ingredient: data as Ingredient };
}

export async function deleteIngredient(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (!error) await logEvent("ingredient_removed", "ingredient", id);
  return { ok: !error };
}

export async function reorderIngredients(
  orderedIds: string[]
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("ingredients")
      .update({ position: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) return { ok: false };
  }
  return { ok: true };
}
