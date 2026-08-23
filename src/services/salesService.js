import { supabase } from "@/lib/supabase";

export async function completeSale({ customerName, customerPhone, paymentMethod, discount = 0, tax = 0, items }) {
  const { data, error } = await supabase.rpc("complete_sale", {
    p_customer_name: customerName || null,
    p_customer_phone: customerPhone || null,
    p_payment_method: paymentMethod,
    p_discount: Number(discount) || 0,
    p_tax: Number(tax) || 0,
    p_items: items.map((item) => ({ medicine_id: item.id, quantity: item.quantity })),
  });
  if (error) throw error;
  return data;
}

export async function getSales({ startDate, endDate, paymentMethod, status } = {}) {
  let query = supabase
    .from("sales")
    .select("*, sale_items(id, quantity, total_price, medicine:medicines(name, batch_number))")
    .order("created_at", { ascending: false });

  if (startDate) query = query.gte("created_at", startDate + "T00:00:00");
  if (endDate) query = query.lte("created_at", endDate + "T23:59:59");
  if (paymentMethod && paymentMethod !== "All") query = query.eq("payment_method", paymentMethod);
  if (status && status !== "All") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getSale(id) {
  const { data, error } = await supabase
    .from("sales")
    .select("*, sold_by_profile:profiles!sales_sold_by_fkey(full_name), sale_items(*, medicine:medicines(name, batch_number, dosage_form))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}