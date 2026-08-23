import { supabase } from "@/lib/supabase";

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("You must be signed in to continue.");
  return user;
}

export async function getCurrentProfile() {
  const user = await requireUser();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(updates) {
  const user = await requireUser();
  const allowed = ["full_name", "phone", "pharmacy_name"];
  const payload = Object.fromEntries(allowed.filter((key) => updates[key] !== undefined).map((key) => [key, updates[key]]));
  const { data, error } = await supabase.from("profiles").update(payload).eq("id", user.id).select().single();
  if (error) throw error;
  return data;
}

export async function updatePharmacy(pharmacyId, updates) {
  const { data, error } = await supabase
    .from("pharmacies")
    .update({ name: updates.name })
    .eq("id", pharmacyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSettings(pharmacyId) {
  const { data, error } = await supabase.from("app_settings").select("*").eq("pharmacy_id", pharmacyId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveSettings(pharmacyId, updates) {
  const { data, error } = await supabase
    .from("app_settings")
    .upsert({ pharmacy_id: pharmacyId, ...updates }, { onConflict: "pharmacy_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAlerts({ limit = 8 } = {}) {
  const { data, error } = await supabase
    .from("alerts")
    .select("id, type, title, message, priority, status, created_at, medicine:medicines(name)")
    .in("status", ["unread", "read"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function updateAlert(id, updates) {
  const allowed = ["status", "resolved_at"];
  const payload = Object.fromEntries(allowed.filter((key) => updates[key] !== undefined).map((key) => [key, updates[key]]));
  const { data, error } = await supabase.from("alerts").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}