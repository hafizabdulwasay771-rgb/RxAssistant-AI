function Button({
  children,
  variant = "primary",
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "bg-teal-600 hover:bg-teal-700 text-white",

    secondary:
      "border border-slate-300 hover:bg-slate-100 text-slate-700",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      type={type}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;