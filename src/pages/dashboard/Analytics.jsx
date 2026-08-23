import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Package, ShoppingCart, TrendingUp, WalletCards } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import { getCurrentProfile, getSettings } from "@/services/appService";
import { buildAnalytics, buildRevenueTrend, getOperationalData } from "@/services/dashboardService";
import { friendlyError } from "@/utils/errors";
import { formatCurrency } from "@/utils/medicine";

const colours = ["#0d9488", "#0284c7", "#f59e0b", "#8b5cf6", "#f43f5e"];

function Metric({ title, value, detail, icon: Icon, tone = "teal" }) {
  const tones = { teal: "bg-teal-50 text-teal-700", blue: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700", red: "bg-rose-50 text-rose-700" };
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{title}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><span className={"grid h-10 w-10 place-items-center rounded-xl " + tones[tone]}><Icon size={20} /></span></div></Card>;
}

function Analytics() {
  const [range, setRange] = useState("30");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (range === "custom" && (!dates.start || !dates.end)) {
      setError("Choose both dates for a custom analytics range.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const profile = await getCurrentProfile();
      const query = range === "custom" ? { startDate: dates.start, endDate: dates.end } : { days: Number(range) };
      const [settings, operational] = await Promise.all([getSettings(profile.pharmacy_id), getOperationalData(query)]);
      const days = range === "custom" ? Math.max(1, Math.round((new Date(dates.end) - new Date(dates.start)) / 86400000) + 1) : Number(range);
      setData({
        summary: buildAnalytics({ ...operational, warningDays: settings?.expiry_warning_days || 30 }),
        trend: buildRevenueTrend(operational.sales, Math.min(days, 90), range === "custom" ? dates.end : undefined),
      });
    } catch (loadError) {
      setError(friendlyError(loadError, "Unable to load analytics."));
    } finally {
      setLoading(false);
    }
  }, [dates.end, dates.start, range]);

  useEffect(() => { load(); }, [load]);

  const hasProducts = Boolean(data?.summary.topProducts.length);
  const hasPayments = Boolean(data?.summary.paymentMethods.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Analytics</h2><p className="mt-1 text-sm text-slate-500">Understand revenue, product movement, payments, and inventory exposure.</p></div><Button variant="secondary" onClick={load}>Refresh data</Button></div>

      <Card className="p-4"><div className="flex flex-wrap items-end gap-3"><label className="min-w-44 text-sm font-semibold text-slate-700">Period<select value={range} onChange={(event) => setRange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-500"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="custom">Custom range</option></select></label>{range === "custom" && <><label className="text-sm font-semibold text-slate-700">Start date<input type="date" value={dates.start} onChange={(event) => setDates((current) => ({ ...current, start: event.target.value }))} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-500" /></label><label className="text-sm font-semibold text-slate-700">End date<input type="date" value={dates.end} onChange={(event) => setDates((current) => ({ ...current, end: event.target.value }))} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-500" /></label></>}</div></Card>

      {loading ? <Loader label="Calculating performance metrics…" /> : error ? <div className="space-y-4"><div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">{error}</div><Button onClick={load}>Try again</Button></div> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric title="Revenue" value={formatCurrency(data.summary.revenue)} detail="Completed sales" icon={TrendingUp} tone="green" /><Metric title="Transactions" value={data.summary.transactions} detail="Completed invoices" icon={ShoppingCart} tone="teal" /><Metric title="Average order" value={formatCurrency(data.summary.averageOrderValue)} detail="Revenue per sale" icon={BarChart3} tone="blue" /><Metric title="Inventory value" value={formatCurrency(data.summary.inventoryValue)} detail="At purchase cost" icon={WalletCards} tone="amber" /><Metric title="Low stock" value={data.summary.lowStock} detail={formatCurrency(data.summary.expiringValue) + " expiry exposure"} icon={Package} tone={data.summary.lowStock ? "red" : "teal"} /></div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><Card className="p-5"><h3 className="text-lg font-extrabold text-slate-900">Revenue by day</h3><p className="mt-1 text-sm text-slate-500">Completed sale revenue in the selected period.</p><div className="mt-5 h-80">{data.trend.some((item) => item.revenue) ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.trend}><CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} /><YAxis tickLine={false} axisLine={false} width={72} tickFormatter={(value) => formatCurrency(value)} /><Tooltip formatter={(value) => formatCurrency(value)} /><Bar dataKey="revenue" name="Revenue" fill="#0d9488" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyState title="No completed sales in this period" description="Revenue analytics will appear when completed sales are recorded." />}</div></Card>

          <Card className="p-5"><h3 className="text-lg font-extrabold text-slate-900">Payment mix</h3><p className="mt-1 text-sm text-slate-500">Revenue grouped by payment method.</p><div className="mt-5 h-80">{hasPayments ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.summary.paymentMethods} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>{data.summary.paymentMethods.map((item, index) => <Cell key={item.name} fill={colours[index % colours.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /></PieChart></ResponsiveContainer> : <EmptyState title="No payment data yet" description="Checkout payment methods will appear here." />}</div></Card></div>

          <Card className="p-5"><h3 className="text-lg font-extrabold text-slate-900">Top-selling medicines</h3><p className="mt-1 text-sm text-slate-500">Ranked by units sold during the selected period.</p>{hasProducts ? <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{data.summary.topProducts.map((product, index) => <div key={product.name} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-teal-700">#{index + 1}</p><p className="mt-2 truncate font-bold text-slate-800">{product.name}</p><p className="mt-1 text-sm text-slate-500">{product.units} units</p><p className="mt-2 text-sm font-bold text-slate-800">{formatCurrency(product.revenue)}</p></div>)}</div> : <div className="mt-4"><EmptyState title="No product movement yet" description="Completed sale items will make this ranking available." /></div>}</Card>
        </>
      )}
    </div>
  );
}

export default Analytics;