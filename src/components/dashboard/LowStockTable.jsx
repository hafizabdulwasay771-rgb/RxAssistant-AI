import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

function LowStockTable({ items }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-extrabold text-slate-900">Low-stock medicines</h2><p className="mt-1 text-sm text-slate-500">Batches needing replenishment attention.</p></div><Link to="/inventory" className="text-sm font-bold text-teal-700 hover:underline">Inventory</Link></div>
      {!items?.length ? <div className="mt-4"><EmptyState title="Stock levels look healthy" description="Low-stock batches will appear here when attention is needed." /></div> : (
        <div className="mt-4 divide-y divide-slate-100">
          {items.map(({ medicine, status }) => <div key={medicine.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate font-bold text-slate-800">{medicine.name}</p><p className="mt-0.5 text-xs text-slate-500">Batch {medicine.batch_number} · Min {medicine.minimum_stock}</p></div><div className="flex shrink-0 items-center gap-3"><span className="font-bold text-slate-800">{medicine.quantity}</span><Badge tone={status.key === "out_of_stock" ? "red" : "amber"}>{status.label}</Badge></div></div>)}
        </div>
      )}
    </section>
  );
}

export default LowStockTable;