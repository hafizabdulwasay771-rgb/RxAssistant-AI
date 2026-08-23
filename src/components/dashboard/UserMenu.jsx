import { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

function UserMenu({ profile }) {
  const [open, setOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const name = profile?.full_name || user?.user_metadata?.full_name || "Pharmacy user";
  const initial = name.trim().charAt(0).toUpperCase() || "R";

  async function logout() {
    const { error } = await signOut();
    if (error) {
      toast.error("We could not sign you out.");
      return;
    }
    navigate("/login", { replace: true });
    toast.success("Signed out.");
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-xl p-1.5 text-left hover:bg-slate-100" aria-expanded={open} aria-label="Open account menu">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-600 text-sm font-bold text-white">{initial}</span>
        <span className="hidden max-w-32 lg:block"><span className="block truncate text-sm font-bold text-slate-800">{name}</span><span className="block text-xs text-slate-500">{profile?.role || "Owner"}</span></span>
      </button>
      {open && <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Settings size={16} /> Settings</Link><button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"><LogOut size={16} /> Sign out</button></div>}
    </div>
  );
}

export default UserMenu;