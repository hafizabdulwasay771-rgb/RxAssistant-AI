import { getMedicineStatus } from "@/utils/medicine";

const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function makeReport(type, { sales, medicines, warningDays = 30 }) {
  if (type === "sales") {
    return {
      headers: ["Invoice", "Date", "Customer", "Items", "Payment", "Status", "Total"],
      rows: sales.map((sale) => [sale.invoice_number, new Date(sale.created_at).toLocaleDateString(), sale.customer_name || "Walk-in", (sale.sale_items || []).reduce((count, item) => count + Number(item.quantity || 0), 0), sale.payment_method, sale.status, Number(sale.total || 0).toFixed(2)]),
    };
  }
  const selected = medicines.filter((medicine) => {
    const key = getMedicineStatus(medicine, warningDays).key;
    return type === "inventory" || (type === "expiry" && ["expiring", "expired"].includes(key)) || (type === "low-stock" && ["low_stock", "out_of_stock"].includes(key));
  });
  return {
    headers: ["Medicine", "Batch", "Manufacturer", "Quantity", "Minimum stock", "Expiry", "Status", "Inventory value"],
    rows: selected.map((medicine) => [medicine.name, medicine.batch_number, medicine.manufacturer, medicine.quantity, medicine.minimum_stock, medicine.expiry_date, getMedicineStatus(medicine, warningDays).label, ((Number(medicine.purchase_price) || 0) * (Number(medicine.quantity) || 0)).toFixed(2)]),
  };
}

export function downloadCsv(filename, report) {
  const content = [report.headers, ...report.rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
