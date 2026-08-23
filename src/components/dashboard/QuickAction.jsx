import { Link } from "react-router-dom";

function QuickAction({ title, description, icon, to }) {
  return (
    <Link to={to} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">{icon}</span>
        <span>
          <span className="block font-bold text-slate-800">{title}</span>
          {description && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}
        </span>
      </div>
    </Link>
  );
}

export default QuickAction;