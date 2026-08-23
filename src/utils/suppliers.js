export function normalizeSupplierName(value) { return String(value ?? '').trim().toLowerCase(); }

export function validateSupplier(values) {
  if (!String(values.name ?? '').trim()) return 'Supplier name is required.';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email).trim())) return 'Enter a valid supplier email.';
  return '';
}

export function resolveSupplierText(value, suppliers = []) {
  const key = normalizeSupplierName(value);
  if (!key) return { supplier_id: null, warning: '' };
  const match = suppliers.find((supplier) => normalizeSupplierName(supplier.name) === key);
  if (!match) return { supplier_id: null, warning: 'No active supplier master match; this value will be retained as legacy text.' };
  if (!match.active) return { supplier_id: null, error: 'Supplier matches an inactive supplier. Reactivate it or use an active supplier.' };
  return { supplier_id: match.id, warning: '' };
}
