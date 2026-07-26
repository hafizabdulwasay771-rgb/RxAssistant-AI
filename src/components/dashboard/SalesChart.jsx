import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", sales: 4200 },
  { month: "Feb", sales: 5100 },
  { month: "Mar", sales: 4700 },
  { month: "Apr", sales: 6200 },
  { month: "May", sales: 7100 },
  { month: "Jun", sales: 6900 },
  { month: "Jul", sales: 8200 },
];

function SalesChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-900">
          Sales Overview
        </h2>

        <p className="text-slate-500">
          Monthly pharmacy sales performance
        </p>

      </div>

      <div className="h-80">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={data}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="sales"
              stroke="#0f766e"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default SalesChart;