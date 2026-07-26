import {
  Package,
  ShoppingCart,
  FileText,
  RefreshCcw,
} from "lucide-react";

const activities = [
  {
    icon: <Package size={18} />,
    title: "Panadol added to inventory",
    time: "5 minutes ago",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: <ShoppingCart size={18} />,
    title: "Sale completed (#10024)",
    time: "18 minutes ago",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: <RefreshCcw size={18} />,
    title: "Stock updated for Augmentin",
    time: "1 hour ago",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: <FileText size={18} />,
    title: "Monthly report generated",
    time: "Today",
    color: "bg-violet-100 text-violet-600",
  },
];

function RecentActivity() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-xl font-bold text-slate-900">
        Recent Activity
      </h2>

      <div className="space-y-5">

        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-center gap-4"
          >

            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center ${activity.color}`}
            >
              {activity.icon}
            </div>

            <div className="flex-1">

              <p className="font-medium text-slate-800">
                {activity.title}
              </p>

              <p className="text-sm text-slate-500">
                {activity.time}
              </p>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default RecentActivity;