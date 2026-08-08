"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";
import type { ReactionType } from "@/lib/core";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleReaction(formData: FormData): Promise<void> {
  const tacoId = String(formData.get("taco_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const reactionType = String(formData.get("reaction_type") ?? "") as ReactionType;

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/t/${slug}`);

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", user!.id)
    .eq("taco_id", tacoId)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      user_id: user!.id,
      taco_id: tacoId,
      reaction_type: reactionType,
    });
    await logEvent("reaction_added", "taco", tacoId, { reaction_type: reactionType });
  }
  revalidatePath(`/t/${slug}`);
}

export async function addResponse(formData: FormData): Promise<void> {
  const tacoId = String(formData.get("taco_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/t/${slug}`);
  if (!body) return;

  await supabase.from("responses").insert({
    user_id: user!.id,
    taco_id: tacoId,
    response_type: "text",
    body,
  });
  await logEvent("response_added", "taco", tacoId);
  revalidatePath(`/t/${slug}`);
}

export async function deleteResponse(formData: FormData): Promise<void> {
  const responseId = String(formData.get("response_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("responses").delete().eq("id", responseId);
  revalidatePath(`/t/${slug}`);
}

export async function toggleSave(formData: FormData): Promise<void> {
  const tacoId = String(formData.get("taco_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/t/${slug}`);

  const { data: existing } = await supabase
    .from("saves")
    .select("id")
    .eq("user_id", user!.id)
    .eq("taco_id", tacoId)
    .is("ingredient_id", null)
    .maybeSingle();

  if (existing) {
    await supabase.from("saves").delete().eq("id", existing.id);
  } else {
    await supabase.from("saves").insert({ user_id: user!.id, taco_id: tacoId });
    await logEvent("taco_saved", "taco", tacoId);
  }
  revalidatePath(`/t/${slug}`);
}

export async function toggleFollow(formData: FormData): Promise<void> {
  const followedId = String(formData.get("followed_user_id") ?? "");
  const username = String(formData.get("username") ?? "");
  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/profile/${username}`);
  if (user!.id === followedId) return;

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user!.id)
    .eq("followed_user_id", followedId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user!.id, followed_user_id: followedId });
    await logEvent("creator_followed", "user", followedId);
  }
  revalidatePath(`/profile/${username}`);
}

export async function submitReport(formData: FormData): Promise<void> {
  const targetType = String(formData.get("target_type") ?? "taco");
  const targetId = String(formData.get("target_id") ?? "");
  const reason = String(formData.get("reason") ?? "other");
  const description = String(formData.get("description") ?? "").slice(0, 1000);
  const slug = String(formData.get("slug") ?? "");

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/t/${slug}`);

  await supabase.from("reports").insert({
    reporter_id: user!.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    description: description || null,
  });
  await logEvent("report_submitted", targetType, targetId);
  revalidatePath(`/t/${slug}`);
}

export async function submitFounderFeedback(formData: FormData): Promise<void> {
  const topic = String(formData.get("topic") ?? "other");
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000);
  const { supabase, user } = await requireUser();
  if (!user || !body) return;

  await supabase.from("founder_feedback").insert({
    user_id: user.id,
    topic,
    body,
  });
  await logEvent("founder_feedback_submitted");
  revalidatePath("/founding-table");
}

export async function createFounderInvite(formData: FormData): Promise<void> {
  const inviteeEmail = String(formData.get("invitee_email") ?? "").trim() || null;
  const { supabase, user } = await requireUser();
  if (!user) return;

  const code = "TABLE-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  await supabase.from("invitations").insert({
    code,
    inviter_id: user.id,
    invitee_email: inviteeEmail,
    role_granted: "member",
    max_uses: 1,
  });
  await logEvent("invitation_sent");
  revalidatePath("/founding-table");
}
