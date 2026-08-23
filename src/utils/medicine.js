const DAY = 24 * 60 * 60 * 1000;

export function dateOnly(value) {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
    ? new Date(year, month - 1, day)
    : null;
}

export function daysUntilExpiry(expiryDate, now = new Date()) {
  const expiry = dateOnly(expiryDate);
  if (!expiry) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((expiry - today) / DAY);
}

export function getExpiryStatus(expiryDate, warningDays = 30, now = new Date()) {
  const days = daysUntilExpiry(expiryDate, now);
  if (days === null) return { key: "unknown", label: "Expiry unknown", days: null };
  if (days < 0) return { key: "expired", label: "Expired", days };
  if (days <= 7) return { key: "critical", label: "Expires in 7 days", days };
  if (days <= 30) return { key: "soon", label: "Expires in 30 days", days };
  if (days <= 60) return { key: "watch", label: "Expires in 60 days", days };
  if (days <= warningDays) return { key: "soon", label: "Expiring soon", days };
  return { key: "safe", label: "Safe", days };
}

export function getMedicineStatus(medicine, warningDays = 30) {
  const expiry = getExpiryStatus(medicine.expiry_date, warningDays);
  const quantity = Number(medicine.quantity) || 0;
  const minimum = Number(medicine.minimum_stock) || 0;
  if (medicine.status === "archived") return { key: "archived", label: "Archived" };
  if (expiry.key === "expired") return { key: "expired", label: "Expired" };
  if (quantity <= 0) return { key: "out_of_stock", label: "Out of stock" };
  if (quantity <= minimum) return { key: "low_stock", label: "Low stock" };
  if (["critical", "soon", "watch"].includes(expiry.key)) return { key: "expiring", label: "Expiring soon" };
  return { key: "in_stock", label: "In stock" };
}

export function formatDate(value) {
  const date = dateOnly(value);
  return date ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date) : "—";
}

export function formatCurrency(value, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
