import { Link } from "react-router-dom";

function QuickAction({
  title,
  icon,
  to,
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
        {icon}
      </div>

      <h3 className="text-center font-semibold text-slate-800">
        {title}
      </h3>
    </Link>
  );
}

export default QuickAction;