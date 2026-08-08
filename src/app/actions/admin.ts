"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";

async function requireModeration() {
  const profile = await getCurrentProfile();
  if (!hasRole(profile, ["moderator", "admin"])) return null;
  return profile;
}

async function requireResearch() {
  const profile = await getCurrentProfile();
  if (!hasRole(profile, ["researcher", "admin"])) return null;
  return profile;
}

export async function toggleFeatureTaco(formData: FormData): Promise<void> {
  if (!(await requireModeration())) return;
  const tacoId = String(formData.get("taco_id") ?? "");
  const featured = formData.get("featured") === "true";
  const supabase = await createClient();
  await supabase.from("tacos").update({ featured: !featured }).eq("id", tacoId);
  revalidatePath("/admin");
  revalidatePath("/home");
}

export async function setTacoStatus(formData: FormData): Promise<void> {
  if (!(await requireModeration())) return;
  const tacoId = String(formData.get("taco_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["published", "hidden", "draft"].includes(status)) return;
  const supabase = await createClient();
  await supabase.from("tacos").update({ status, featured: false }).eq("id", tacoId);
  await logEvent("moderation_status_change", "taco", tacoId, { status });
  revalidatePath("/admin");
  revalidatePath("/explore");
}

export async function resolveReport(formData: FormData): Promise<void> {
  const profile = await requireModeration();
  if (!profile) return;
  const reportId = String(formData.get("report_id") ?? "");
  const status = String(formData.get("status") ?? "resolved");
  const notes = String(formData.get("moderator_notes") ?? "").slice(0, 1000);
  if (!["resolved", "dismissed", "reviewing"].includes(status)) return;
  const supabase = await createClient();
  await supabase
    .from("reports")
    .update({
      status,
      moderator_id: profile.id,
      moderator_notes: notes || null,
      resolved_at: status === "reviewing" ? null : new Date().toISOString(),
    })
    .eq("id", reportId);
  revalidatePath("/admin");
}

export async function createAdminInvitation(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!hasRole(profile, ["admin"])) return;
  const roleGranted = String(formData.get("role_granted") ?? "member");
  const maxUses = Math.min(
    500,
    Math.max(1, parseInt(String(formData.get("max_uses") ?? "1"), 10) || 1)
  );
  if (!["member", "founder"].includes(roleGranted)) return;

  const prefix = roleGranted === "founder" ? "FOUNDING" : "TASTE";
  const code = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const supabase = await createClient();
  await supabase.from("invitations").insert({
    code,
    inviter_id: profile!.id,
    role_granted: roleGranted,
    max_uses: maxUses,
  });
  revalidatePath("/admin");
}

// ---------------- Research ----------------

export async function createParticipant(formData: FormData): Promise<void> {
  if (!(await requireResearch())) return;
  const personaType = String(formData.get("persona_type") ?? "").slice(0, 80);
  const source = String(formData.get("recruitment_source") ?? "").slice(0, 120);
  const isMinor = formData.get("is_minor") === "on";

  const code = "MT-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const supabase = await createClient();
  await supabase.from("research_participants").insert({
    participant_code: code,
    persona_type: personaType || null,
    recruitment_source: source || null,
    is_minor: isMinor,
  });
  revalidatePath("/research");
}

export async function updateConsents(formData: FormData): Promise<void> {
  if (!(await requireResearch())) return;
  const participantId = String(formData.get("participant_id") ?? "");
  const fields = [
    "guardian_consent",
    "consent_research",
    "consent_recording",
    "consent_public_content",
    "consent_marketing",
    "consent_testimonial",
    "withdrawal_requested",
  ] as const;
  const update: Record<string, boolean | string> = {};
  for (const f of fields) update[f] = formData.get(f) === "on";
  const status = String(formData.get("session_status") ?? "");
  if (["recruited", "scheduled", "completed", "withdrawn"].includes(status)) {
    update.session_status = status;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("research_participants")
    .update(update)
    .eq("id", participantId);
  if (!error) {
    await logEvent("consent_updated", "research_participant", participantId);
  }
  revalidatePath("/research");
}

export async function createSession(formData: FormData): Promise<void> {
  const profile = await requireResearch();
  if (!profile) return;
  const participantId = String(formData.get("participant_id") ?? "");
  const sessionType = String(formData.get("session_type") ?? "remote");
  const supabase = await createClient();
  await supabase.from("research_sessions").insert({
    participant_id: participantId,
    facilitator_id: profile.id,
    session_type: sessionType === "in_person" ? "in_person" : "remote",
  });
  await logEvent("session_created", "research_participant", participantId);
  revalidatePath("/research");
}

export async function addObservation(formData: FormData): Promise<void> {
  if (!(await requireResearch())) return;
  const sessionId = String(formData.get("session_id") ?? "");
  const taskCode = String(formData.get("task_code") ?? "general").slice(0, 40);
  const observationType = String(formData.get("observation_type") ?? "note");
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!note) return;
  const supabase = await createClient();
  await supabase.from("research_observations").insert({
    session_id: sessionId,
    task_code: taskCode,
    observation_type: [
      "note",
      "success",
      "failure",
      "confusion",
      "quote",
      "feature_request",
    ].includes(observationType)
      ? observationType
      : "note",
    note,
  });
  revalidatePath("/research");
}

export async function completeSession(formData: FormData): Promise<void> {
  if (!(await requireResearch())) return;
  const sessionId = String(formData.get("session_id") ?? "");
  const summary = String(formData.get("summary") ?? "").slice(0, 4000);
  const supabase = await createClient();
  await supabase
    .from("research_sessions")
    .update({ completion_status: "completed", summary: summary || null })
    .eq("id", sessionId);
  await logEvent("session_completed", "research_session", sessionId);
  revalidatePath("/research");
}
