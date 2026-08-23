function Input({ id, label, error, type = "text", className = "", ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>}
      <input id={id} type={type} aria-invalid={Boolean(error)} className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 ${error ? "border-rose-400" : "border-slate-200"} ${className}`} {...props} />
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
export default Input;