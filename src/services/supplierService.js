import { supabase } from '@/lib/supabase';

const fields = ['name', 'contact_person', 'phone', 'email', 'address', 'city', 'notes', 'active'];
function pick(values) { return Object.fromEntries(fields.filter((field) => values[field] !== undefined).map((field) => [field, values[field] === '' ? null : values[field]])); }

export async function getSuppliers({ includeInactive = true } = {}) {
  let query = supabase.from('suppliers').select('*').order('name');
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
export async function createSupplier(values) { const { data, error } = await supabase.from('suppliers').insert(pick(values)).select().single(); if (error) throw error; return data; }
export async function updateSupplier(id, values) { const { data, error } = await supabase.from('suppliers').update(pick(values)).eq('id', id).select().single(); if (error) throw error; return data; }
export async function deactivateSupplier(id) { return updateSupplier(id, { active: false }); }
export async function getSupplierDetail(id) {
  const { data: supplier, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: batches, error: batchError } = await supabase.from('medicines').select('id,name,batch_number,quantity,expiry_date,purchase_price,selling_price,received_at').eq('supplier_id', id).order('received_at', { ascending: false });
  if (batchError) throw batchError;
  const ids = (batches || []).map((batch) => batch.id);
  let activity = [];
  if (ids.length) { const { data, error: activityError } = await supabase.from('inventory_transactions').select('id,medicine_id,quantity,created_at,notes').in('medicine_id', ids).eq('transaction_type', 'purchase').order('created_at', { ascending: false }).limit(10); if (activityError) throw activityError; activity = data || []; }
  return { supplier, batches: batches || [], activity };
}
