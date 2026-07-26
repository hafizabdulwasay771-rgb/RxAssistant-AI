import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Inventory",
      icon: Package,
      path: "/inventory",
    },
    {
      name: "Sales",
      icon: ShoppingCart,
      path: "/sales",
    },
    {
      name: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      name: "Reports",
      icon: FileText,
      path: "/reports",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-sm">

      {/* Logo */}

      <div className="h-20 flex items-center justify-center border-b border-slate-200">

        <div className="flex items-center gap-3">

          <div className="h-11 w-11 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
            Rx
          </div>

          <div>

            <h1 className="font-bold text-slate-900">
              Rx Assistant
            </h1>

            <p className="text-xs text-slate-500">
              AI Pharmacy
            </p>

          </div>

        </div>

      </div>

      {/* Navigation */}

      <nav className="p-4 space-y-2">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                  isActive
                    ? "bg-teal-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={20} />

              <span>{item.name}</span>

            </NavLink>
          );
        })}

      </nav>

    </aside>
  );
}

export default Sidebar;