import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency } from "@/utils/medicine";

function SalesChart({ data }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div><h2 className="text-lg font-extrabold text-slate-900">Revenue activity</h2><p className="mt-1 text-sm text-slate-500">Completed sale revenue over the last seven days.</p></div>
      <div className="mt-5 h-72">
        {data?.some((item) => item.revenue > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 2, right: 10, top: 10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#0d9488" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyState title="No sales activity yet" description="Completed sales will appear here as your pharmacy starts trading." />}
      </div>
    </section>
  );
}

export default SalesChart;