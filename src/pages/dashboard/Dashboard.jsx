import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, DollarSign, FileText, Package, PackagePlus, ShoppingCart, WalletCards } from "lucide-react";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import Badge from "@/components/ui/Badge";
import KpiCard from "@/components/dashboard/KpiCard";
import QuickAction from "@/components/dashboard/QuickAction";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SalesChart from "@/components/dashboard/SalesChart";
import LowStockTable from "@/components/dashboard/LowStockTable";
import { getCurrentProfile, getSettings } from "@/services/appService";
import { buildDashboardSnapshot, getOperationalData } from "@/services/dashboardService";
import { friendlyError } from "@/utils/errors";
import { formatCurrency, formatDate } from "@/utils/medicine";

function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const profile = await getCurrentProfile();
      const [settings, operational] = await Promise.all([getSettings(profile.pharmacy_id), getOperationalData({ days: 30 })]);
      setSnapshot(buildDashboardSnapshot({ ...operational, warningDays: settings?.expiry_warning_days || 30 }));
    } catch (loadError) {
      setError(friendlyError(loadError, "Unable to load your pharmacy dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader label="Loading pharmacy overview…" />;
  if (error) return <div className="space-y-4"><div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">{error}</div><Button onClick={load}>Try again</Button></div>;

  const { metrics, chart, lowStock, expiring, recentSales } = snapshot;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Pharmacy overview</h2><p className="mt-1 text-sm text-slate-500">Live operations data from your medicines and completed sales.</p></div><Button variant="secondary" onClick={load}>Refresh data</Button></div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Today's revenue" value={formatCurrency(metrics.todayRevenue)} detail={metrics.todaySales + " completed sales today"} tone="green" icon={<DollarSign size={21} />} />
        <KpiCard title="Total medicines" value={metrics.medicineCount} detail="Active medicine batches" tone="teal" icon={<Package size={21} />} />
        <KpiCard title="Low stock" value={metrics.lowStock} detail="Low or out-of-stock batches" tone={metrics.lowStock ? "amber" : "teal"} icon={<AlertTriangle size={21} />} />
        <KpiCard title="Expiring soon" value={metrics.expiring} detail="Expiring or expired batches" tone={metrics.expiring ? "red" : "teal"} icon={<AlertTriangle size={21} />} />
        <KpiCard title="Inventory value" value={formatCurrency(metrics.inventoryValue)} detail="At purchase cost" tone="blue" icon={<WalletCards size={21} />} />
        <KpiCard title="Today's sales" value={metrics.todaySales} detail="Invoices completed today" tone="green" icon={<ShoppingCart size={21} />} />
      </div>

      <section><div className="mb-3"><h3 className="font-extrabold text-slate-900">Quick actions</h3><p className="text-sm text-slate-500">Start the most common pharmacy tasks.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><QuickAction to="/inventory" title="Add medicine" description="Register a new batch" icon={<PackagePlus size={20} />} /><QuickAction to="/sales" title="New sale" description="Open the POS checkout" icon={<ShoppingCart size={20} />} /><QuickAction to="/inventory" title="Review inventory" description="Check stock and expiry" icon={<Package size={20} />} /><QuickAction to="/reports" title="Create report" description="Preview or export data" icon={<FileText size={20} />} /></div></section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]"><div className="space-y-6"><SalesChart data={chart} /><LowStockTable items={lowStock} /></div><div className="space-y-6"><RecentActivity sales={recentSales} /><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-extrabold text-slate-900">Expiry attention</h2><p className="mt-1 text-sm text-slate-500">Batches that require review.</p>{!expiring.length ? <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">No expiring batches need attention right now.</p> : <div className="mt-4 divide-y divide-slate-100">{expiring.map(({ medicine, status }) => <div key={medicine.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-bold text-slate-800">{medicine.name}</p><p className="text-xs text-slate-500">{formatDate(medicine.expiry_date)}</p></div><Badge tone={status.key === "expired" ? "red" : "amber"}>{status.label}</Badge></div>)}</div>}</section></div></div>
    </div>
  );
}

export default Dashboard;