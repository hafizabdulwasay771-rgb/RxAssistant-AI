import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  PackagePlus,
  FileText,
} from "lucide-react";

import KpiCard from "../../components/dashboard/KpiCard";
import QuickAction from "../../components/dashboard/QuickAction";
import RecentActivity from "../../components/dashboard/RecentActivity";
import SalesChart from "../../components/dashboard/SalesChart";
import LowStockTable from "../../components/dashboard/LowStockTable";
function Dashboard() {
  return (
    <div className="space-y-8">

      {/* Welcome */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome Back 👋
        </h1>

        <p className="mt-2 text-slate-500">
          Here's an overview of your pharmacy today.
        </p>
      </div>

      {/* KPI Cards */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          title="Total Revenue"
          value="$24,500"
          icon={<DollarSign size={26} />}
          color="bg-emerald-600"
        />

        <KpiCard
          title="Today's Sales"
          value="128"
          icon={<ShoppingCart size={26} />}
          color="bg-blue-600"
        />

        <KpiCard
          title="Medicines"
          value="540"
          icon={<Package size={26} />}
          color="bg-violet-600"
        />

        <KpiCard
          title="Low Stock"
          value="12"
          icon={<AlertTriangle size={26} />}
          color="bg-red-600"
        />

      </div>

      {/* Dashboard Content */}

      <div className="grid gap-8 lg:grid-cols-3">

        {/* Left Side */}

        <div className="lg:col-span-2 space-y-8">

          {/* Quick Actions */}

          <div className="space-y-5">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="text-slate-500">
                Frequently used pharmacy operations.
              </p>

            </div>

            <div className="grid gap-6 sm:grid-cols-2">

              <QuickAction
                title="Add Medicine"
                icon={<PackagePlus size={28} />}
                to="/inventory"
              />

              <QuickAction
                title="New Sale"
                icon={<ShoppingCart size={28} />}
                to="/sales"
              />

              <QuickAction
                title="View Inventory"
                icon={<Package size={28} />}
                to="/inventory"
              />

              <QuickAction
                title="Generate Report"
                icon={<FileText size={28} />}
                to="/reports"
              />

            </div>

                   </div>

          {/* Sales Chart */}

          <SalesChart />
          <LowStockTable />

        </div>

        {/* Right Side */}
        <div>

          <RecentActivity />

        </div>

      </div>

    </div>
  );
}

export default Dashboard;