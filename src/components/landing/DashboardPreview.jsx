import {
  Pill,
  BellRing,
  TrendingUp,
  PackageCheck,
  Bot,
} from "lucide-react";

function DashboardPreview() {
  return (
    <div className="bg-white rounded-[32px] shadow-2xl p-8 border border-slate-100">

      {/* Revenue */}

      <div className="flex justify-between items-start">

        <div>

          <p className="text-slate-500 text-sm">
            Today's Revenue
          </p>

          <h2 className="mt-2 text-5xl font-bold text-slate-900">
            PKR 245K
          </h2>

        </div>

        <div className="rounded-xl bg-green-100 px-4 py-2 font-semibold text-green-700">
          ↑ 18%
        </div>

      </div>

      {/* Cards */}

      <div className="grid grid-cols-2 gap-5 mt-8">

        <div className="rounded-2xl bg-slate-50 p-6">

          <Pill className="text-teal-600" />

          <h3 className="mt-3 font-bold">
            Inventory
          </h3>

          <p className="text-slate-500 mt-2">
            12,540 Medicines
          </p>

        </div>

        <div className="rounded-2xl bg-green-50 p-6">

          <BellRing className="text-green-600" />

          <h3 className="mt-3 font-bold">
            AI Alerts
          </h3>

          <p className="text-slate-500 mt-2">
            38 Active Alerts
          </p>

        </div>

        <div className="rounded-2xl bg-blue-50 p-6">

          <TrendingUp className="text-blue-600" />

          <h3 className="mt-3 font-bold">
            Sales
          </h3>

          <p className="text-slate-500 mt-2">
            PKR 1.8M
          </p>

        </div>

        <div className="rounded-2xl bg-orange-50 p-6">

          <PackageCheck className="text-orange-600" />

          <h3 className="mt-3 font-bold">
            Expiring Soon
          </h3>

          <p className="text-slate-500 mt-2">
            34 Medicines
          </p>

        </div>

      </div>

      {/* AI */}

      <div className="mt-8 rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 p-7 text-white">

        <div className="flex items-center gap-3">

          <Bot />

          <h3 className="font-bold text-xl">
            Rx Assistant AI
          </h3>

        </div>

        <p className="mt-4 leading-8 text-white/90">

          Paracetamol stock is predicted to finish in
          <strong> 6 days</strong>.

          Recommended reorder:

          <strong> 1,200 units.</strong>

        </p>

      </div>

    </div>
  );
}

export default DashboardPreview;