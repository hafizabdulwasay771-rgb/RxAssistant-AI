import { supabase } from "@/lib/supabase";

const editableFields = [
  "name", "generic_name", "dosage_form", "strength", "therapeutic_class",
    "manufacturer", "selling_price", "minimum_stock", "supplier", "status",
  "supplier_id",
];

function pickEditable(values) {
  return Object.fromEntries(
    editableFields
      .filter((field) => values[field] !== undefined)
      .map((field) => [field, values[field] === "" ? null : values[field]]),
  );
}

export async function getMedicines({ includeArchived = false, pharmacyId } = {}) {
  let query = supabase
    .from("medicines")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) query = query.neq("status", "archived");
  if (pharmacyId) query = query.eq("pharmacy_id", pharmacyId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function receiveStock(receipt) {
  const { data, error } = await supabase.rpc("receive_stock", {
    p_name: receipt.name,
    p_generic_name: receipt.generic_name || null,
    p_dosage_form: receipt.dosage_form,
    p_strength: receipt.strength || null,
    p_therapeutic_class: receipt.therapeutic_class || null,
    p_manufacturer: receipt.manufacturer,
    p_batch_number: receipt.batch_number,
    p_expiry_date: receipt.expiry_date,
    p_purchase_price: Number(receipt.purchase_price),
    p_selling_price: Number(receipt.selling_price),
    p_quantity: Number(receipt.quantity),
    p_minimum_stock: Number(receipt.minimum_stock),
    p_supplier: receipt.supplier || null,
    p_received_at: receipt.received_at,
    p_notes: receipt.notes || null,
    p_supplier_id: receipt.supplier_id || null,
  });

  if (error) throw error;
  return data;
}

export async function importStock(receipts) {
  const { data, error } = await supabase.rpc("receive_stock_bulk", {
    p_rows: receipts.map((receipt) => ({
      ...receipt,
      purchase_price: Number(receipt.purchase_price),
      selling_price: Number(receipt.selling_price),
      quantity: Number(receipt.quantity),
      minimum_stock: Number(receipt.minimum_stock || 0),
    })),
  });
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

