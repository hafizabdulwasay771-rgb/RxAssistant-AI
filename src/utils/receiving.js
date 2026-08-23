const requiredFields = ["name", "dosage_form", "manufacturer", "batch_number", "expiry_date", "purchase_price", "selling_price", "quantity"];

export function validateReceipt(form, today = new Date().toISOString().slice(0, 10)) {
  if (requiredFields.some((field) => !String(form[field] ?? "").trim())) return "Complete all required batch, price, and quantity fields.";
  if (Number(form.quantity) <= 0 || !Number.isInteger(Number(form.quantity))) return "Quantity received must be a positive whole number.";
  if (!Number.isFinite(Number(form.purchase_price)) || !Number.isFinite(Number(form.selling_price)) || Number(form.purchase_price) < 0 || Number(form.selling_price) < 0) return "Prices must be valid non-negative numbers.";
  if (Number(form.selling_price) < Number(form.purchase_price)) return "Selling price cannot be lower than purchase price.";
  if (Number(form.minimum_stock) < 0 || !Number.isInteger(Number(form.minimum_stock))) return "Minimum stock must be a non-negative whole number.";
  if (form.expiry_date < today) return "Expiry date must be today or later.";
  if (form.received_at > today) return "Received date must be today or earlier.";
  return null;
}
