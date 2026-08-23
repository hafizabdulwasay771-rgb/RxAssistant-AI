import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
function DashboardLayout() { const [mobileOpen, setMobileOpen] = useState(false); return <div className="min-h-screen bg-slate-50"><Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="min-h-screen lg:pl-64"><Topbar onMenu={() => setMobileOpen(true)} /><main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"><Outlet /></main></div></div>; }
export default DashboardLayout;