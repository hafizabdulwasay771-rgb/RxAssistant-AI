import { supabase } from "@/lib/supabase";

const editableFields = [
  "name", "generic_name", "dosage_form", "strength", "therapeutic_class",
  "manufacturer", "batch_number", "expiry_date", "purchase_price", "selling_price",
  "quantity", "minimum_stock", "supplier", "status",
];

function pickEditable(values) {
  return Object.fromEntries(
    editableFields
      .filter((field) => values[field] !== undefined)
      .map((field) => [field, values[field] === "" ? null : values[field]]),
  );
}

export async function getMedicines({ includeArchived = false } = {}) {
  let query = supabase
    .from("medicines")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) query = query.neq("status", "archived");

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addMedicine(medicine) {
  const { data, error } = await supabase
    .from("medicines")
    .insert(pickEditable(medicine))
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMedicine(id, updates) {
  const { data, error } = await supabase
    .from("medicines")
    .update(pickEditable(updates))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function archiveMedicine(id) {
  const { data, error } = await supabase
    .from("medicines")
    .update({ status: "archived" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}