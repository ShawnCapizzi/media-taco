"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";
import { CURRENT_YEAR, MIN_AGE } from "@/lib/core";

export type FormState = { error?: string; message?: string };

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

export async function joinAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const birthYearRaw = String(formData.get("birth_year") ?? "").trim();
  const inviteCode = String(formData.get("invite_code") ?? "").trim().toUpperCase();
  const agreed = formData.get("agree_standards") === "on";

  if (!email || !password || !username || !displayName || !birthYearRaw) {
    return { error: "Every field except the invitation code is required." };
  }
  if (!USERNAME_RE.test(username)) {
    return { error: "Usernames are 3 to 24 characters: lowercase letters, numbers, and underscores." };
  }
  if (password.length < 8) {
    return { error: "Passwords need at least 8 characters." };
  }
  if (!agreed) {
    return { error: "Please review and agree to the community standards to join." };
  }

  const birthYear = parseInt(birthYearRaw, 10);
  if (Number.isNaN(birthYear) || birthYear < 1900 || birthYear > CURRENT_YEAR) {
    return { error: "Enter the four-digit year you were born." };
  }
  if (CURRENT_YEAR - birthYear < MIN_AGE) {
    return {
      error:
        "Media Taco is for people 13 and older. We are not able to create this account.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
        birth_year: birthYear,
        invite_code: inviteCode,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/home?welcome=1");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/home");

  if (!email || !password) {
    return { error: "Enter your email and password to sign in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "That email and password combination did not work. Check both and try again." };
  }
  redirect(next.startsWith("/") ? next : "/home");
}

export async function magicLinkAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email to receive a sign-in link." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  if (error) {
    return { error: error.message };
  }
  return { message: "Check your email for a sign-in link. It expires in one hour." };
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to edit your profile." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const interestsRaw = String(formData.get("interests") ?? "").trim();
  const visibility = String(formData.get("profile_visibility") ?? "public");
  const openToCollab = formData.get("open_to_collaboration") === "on";

  if (!displayName) return { error: "Display name is required." };
  if (!["public", "community", "private"].includes(visibility)) {
    return { error: "Choose a valid profile visibility." };
  }

  const interests = interestsRaw
    ? interestsRaw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12)
    : [];

  const { error } = await supabase
    .from("users")
    .update({
      display_name: displayName,
      bio,
      interests,
      profile_visibility: visibility,
      open_to_collaboration: openToCollab,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await logEvent("profile_updated", "user", user.id);
  revalidatePath("/", "layout");
  return { message: "Profile saved." };
}
