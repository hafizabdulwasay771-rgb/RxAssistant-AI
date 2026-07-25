import { Loader2 } from "lucide-react";

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
}) {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    border: "none",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "all .3s ease",
    fontWeight: 600,
    borderRadius: "var(--radius-md)",
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? "100%" : "auto",
  };

  const variants = {
    primary: {
      background: "var(--color-primary)",
      color: "#fff",
    },

    secondary: {
      background: "#fff",
      color: "var(--color-text)",
      border: "1px solid var(--color-border)",
    },

    danger: {
      background: "var(--color-danger)",
      color: "#fff",
    },
  };

  const sizes = {
    sm: {
      padding: "10px 18px",
      fontSize: "14px",
    },

    md: {
      padding: "14px 26px",
      fontSize: "16px",
    },

    lg: {
      padding: "18px 34px",
      fontSize: "18px",
    },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size],
      }}
      className={className}
    >
      {loading ? (
        <Loader2
          size={18}
          className="animate-spin"
        />
      ) : (
        leftIcon
      )}

      {children}

      {!loading && rightIcon}
    </button>
  );
}

export default Button;