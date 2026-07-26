import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-100">

      {/* Sidebar */}

      <Sidebar />

      {/* Main Section */}

      <div className="ml-64">

        <Topbar />

        <main className="p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;