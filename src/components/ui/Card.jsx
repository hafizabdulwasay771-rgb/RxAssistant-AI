function Card({ children, className = "", ...props }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`} {...props}>{children}</section>;
}
export default Card;