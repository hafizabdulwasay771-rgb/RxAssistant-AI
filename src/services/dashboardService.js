import { supabase } from "@/lib/supabase";
import { getMedicineConditions, getMedicineStatus, startOfDay } from "@/utils/medicine";

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function normaliseSales(sales) {
  return (sales || []).filter((sale) => sale.status === "completed");
}

export async function getOperationalData({ days = 30, startDate, endDate } = {}) {
  const from = startDate ? new Date(startDate + "T00:00:00") : new Date();
  if (!startDate) from.setDate(from.getDate() - Math.max(days - 1, 0));

  let salesQuery = supabase
    .from("sales")
    .select("*, sale_items(quantity, total_price, medicine:medicines(name))")
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: true });

  if (endDate) salesQuery = salesQuery.lte("created_at", endDate + "T23:59:59");

  const [medicinesResult, salesResult] = await Promise.all([
    supabase.from("medicines").select("*").neq("status", "archived").order("name"),
    salesQuery,
  ]);

  if (medicinesResult.error) throw medicinesResult.error;
  if (salesResult.error) throw salesResult.error;

  return {
    medicines: medicinesResult.data || [],
    sales: normaliseSales(salesResult.data),
  };
}

export function buildRevenueTrend(sales, days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = isoDay(date);
    return {
      label: new Intl.DateTimeFormat("en", { month: days > 14 ? "short" : undefined, day: "numeric", weekday: days <= 7 ? "short" : undefined }).format(date),
      revenue: sales.filter((sale) => sale.created_at.slice(0, 10) === key).reduce((sum, sale) => sum + Number(sale.total || 0), 0),
      transactions: sales.filter((sale) => sale.created_at.slice(0, 10) === key).length,
    };
  });
}

export function buildDashboardSnapshot({ medicines, sales, warningDays = 30 }) {
  const today = startOfDay();
  const todaySales = sales.filter((sale) => new Date(sale.created_at) >= today);
  const statused = medicines.map((medicine) => ({ medicine, status: getMedicineStatus(medicine, warningDays), conditions: getMedicineConditions(medicine, warningDays) }));
  const inventoryValue = medicines.reduce((total, item) => total + (Number(item.purchase_price) || 0) * (Number(item.quantity) || 0), 0);

  return {
    metrics: {
      todayRevenue: todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
      todaySales: todaySales.length,
      medicineCount: medicines.length,
      lowStock: statused.filter(({ conditions }) => conditions.lowStock).length,
      expiring: statused.filter(({ conditions }) => conditions.expiring || conditions.expired).length,
      inventoryValue,
    },
    chart: buildRevenueTrend(sales, 7),
    lowStock: statused.filter(({ conditions }) => conditions.lowStock).slice(0, 6),
    expiring: statused.filter(({ conditions }) => conditions.expiring || conditions.expired).slice(0, 6),
    recentSales: [...sales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
  };
}

export function buildAnalytics({ medicines, sales, warningDays = 30 }) {
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const items = sales.flatMap((sale) => sale.sale_items || []);
  const topProducts = Object.values(items.reduce((result, item) => {
    const name = item.medicine?.name || "Archived medicine";
    result[name] ||= { name, units: 0, revenue: 0 };
    result[name].units += Number(item.quantity || 0);
    result[name].revenue += Number(item.total_price || 0);
    return result;
  }, {})).sort((a, b) => b.units - a.units).slice(0, 5);

  const paymentMethods = Object.entries(sales.reduce((result, sale) => {
    const key = sale.payment_method || "Other";
    result[key] = (result[key] || 0) + Number(sale.total || 0);
    return result;
  }, {})).map(([name, value]) => ({ name, value }));

  const statused = medicines.map((medicine) => getMedicineStatus(medicine, warningDays));
  return {
    revenue,
    transactions: sales.length,
    averageOrderValue: sales.length ? revenue / sales.length : 0,
    inventoryValue: medicines.reduce((sum, medicine) => sum + Number(medicine.purchase_price || 0) * Number(medicine.quantity || 0), 0),
    expiringValue: medicines.filter((medicine) => ["expiring", "expired"].includes(getMedicineStatus(medicine, warningDays).key)).reduce((sum, medicine) => sum + Number(medicine.purchase_price || 0) * Number(medicine.quantity || 0), 0),
    lowStock: statused.filter((status) => ["low_stock", "out_of_stock"].includes(status.key)).length,
    topProducts,
    paymentMethods,
  };
}
