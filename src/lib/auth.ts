import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/core";

// Returns the signed-in member profile, or null.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}

export function hasRole(profile: Profile | null, roles: string[]): boolean {
  return !!profile && roles.includes(profile.role);
}
