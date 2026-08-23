import { Inbox } from "lucide-react";
function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center"><div className="mb-3 rounded-2xl bg-teal-50 p-3 text-teal-600"><Icon size={24} /></div><h3 className="font-bold text-slate-800">{title}</h3>{description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}{action && <div className="mt-5">{action}</div>}</div>;
}
export default EmptyState;