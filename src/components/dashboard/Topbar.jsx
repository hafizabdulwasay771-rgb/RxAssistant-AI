import { Bell, Search } from "lucide-react";

function Topbar() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">

      {/* Left */}

      <div>

        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500">
          Welcome back 👋
        </p>

      </div>

      {/* Center */}

      <div className="hidden lg:block">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search medicines..."
            className="w-80 rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-teal-500"
          />

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-6">

        <button className="relative">

          <Bell
            size={22}
            className="text-slate-600"
          />

          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500"></span>

        </button>

        <div className="flex items-center gap-3">

          <div className="h-11 w-11 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
            A
          </div>

          <div className="hidden md:block">

            <p className="font-semibold text-slate-800">
              Admin
            </p>

            <p className="text-xs text-slate-500">
              Pharmacy Owner
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;