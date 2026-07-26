function KpiCard({
  title,
  value,
  icon,
  color = "bg-teal-600",
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-md transition">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h2>

        </div>

        <div
          className={`h-14 w-14 rounded-xl ${color} flex items-center justify-center text-white`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

export default KpiCard;