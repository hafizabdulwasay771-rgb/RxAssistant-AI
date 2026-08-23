import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-300",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300",
  ghost: "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300",
};
const sizes = { sm: "px-3 py-2 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-base" };

function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  type = "button",
  onClick,
  className = "",
  as: Component = "button",
  ...props
}) {
  const sharedProps = {
    disabled: disabled || loading,
    onClick,
    className: `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`,
    ...props,
  };

  if (Component === "button") sharedProps.type = type;

  return (
    <Component {...sharedProps}>
      {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </Component>
  );
}

export default Button;