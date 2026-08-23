import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency } from "@/utils/medicine";

function RecentActivity({ sales }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-extrabold text-slate-900">Recent sales</h2><p className="mt-1 text-sm text-slate-500">Latest completed transactions.</p></div><Link to="/sales/history" className="text-sm font-bold text-teal-700 hover:underline">View all</Link></div>
      {!sales?.length ? <div className="mt-4"><EmptyState icon={ShoppingCart} title="No recent sales" description="Sales activity will appear here after checkout." /></div> : (
        <div className="mt-4 divide-y divide-slate-100">
          {sales.map((sale) => <div key={sale.id} className="flex gap-3 py-3"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><ShoppingCart size={17} /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="truncate font-bold text-slate-800">{sale.invoice_number}</p><p className="shrink-0 text-sm font-bold text-slate-800">{formatCurrency(sale.total)}</p></div><p className="mt-1 text-xs text-slate-500">{sale.customer_name || "Walk-in customer"} · {new Date(sale.created_at).toLocaleString()}</p></div></div>)}
        </div>
      )}
    </section>
  );
}

export default RecentActivity;