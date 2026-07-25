function Input({
  type = "text",
  placeholder = "",
  value,
  onChange,
  name,
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="
        w-full
        rounded-xl
        border
        border-slate-300
        bg-white
        px-4
        py-3
        text-slate-900
        placeholder:text-slate-400
        outline-none
        transition-all
        duration-200
        focus:border-teal-500
        focus:ring-4
        focus:ring-teal-100
      "
    />
  );
}

export default Input;