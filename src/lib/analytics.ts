// Product event logging. Names and ids only. Never log content bodies,
// private text, emails, or anything that could identify private Tacos.
import { createClient } from "@/lib/supabase/server";

export async function logEvent(
  eventName: string,
  objectType?: string,
  objectId?: string,
  properties?: Record<string, string | number | boolean>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("product_events").insert({
      user_id: user.id,
      event_name: eventName,
      object_type: objectType ?? null,
      object_id: objectId ?? null,
      properties_json: properties ?? {},
    });
  } catch {
    // Analytics must never break a product flow.
  }
}
