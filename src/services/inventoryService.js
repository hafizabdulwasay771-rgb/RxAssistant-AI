import { supabase } from "../lib/supabase";

// Get all medicines
export async function getMedicines() {
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

// Add a medicine
export async function addMedicine(medicine) {
  const { data, error } = await supabase
    .from("medicines")
    .insert([medicine])
    .select();

  if (error) throw error;

  return data;
}

// Update medicine
export async function updateMedicine(id, updates) {
  const { data, error } = await supabase
    .from("medicines")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

// Delete medicine
export async function deleteMedicine(id) {
  const { error } = await supabase
    .from("medicines")
    .delete()
    .eq("id", id);

  if (error) throw error;
}