const colours = {
  teal: "bg-teal-50 text-teal-700 ring-teal-600/10",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
  red: "bg-rose-50 text-rose-700 ring-rose-600/10",
  slate: "bg-slate-100 text-slate-700 ring-slate-600/10",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/10",
};
function Badge({ children, tone = "slate", className = "" }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colours[tone] || colours.slate} ${className}`}>{children}</span>;
}
export default Badge;