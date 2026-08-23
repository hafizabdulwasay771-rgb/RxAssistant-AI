import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

function AuthLayout() {
  const { error } = useAuth();
  return <div className="min-h-screen bg-slate-50 p-6"><div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center"><div className="w-full">{error && <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</div>}<Outlet /></div></div></div>;
}

export default AuthLayout;