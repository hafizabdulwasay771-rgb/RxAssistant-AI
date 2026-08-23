import { Loader2 } from "lucide-react";
function Loader({ fullScreen = false, label = "Loading…" }) {
  return <div className={`${fullScreen ? "min-h-screen" : "min-h-56"} flex flex-col items-center justify-center gap-3 text-slate-500`}><Loader2 className="animate-spin text-teal-600" size={28} /><p className="text-sm font-medium">{label}</p></div>;
}
export default Loader;