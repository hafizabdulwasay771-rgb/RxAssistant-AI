import { useEffect } from "react";
import { X } from "lucide-react";

function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`max-h-[90vh] w-full ${widths[size] || widths.md} overflow-y-auto rounded-2xl bg-white shadow-2xl`} role="dialog" aria-modal="true" aria-label={title}><div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 className="text-lg font-bold text-slate-900">{title}</h2><button type="button" aria-label="Close modal" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={19} /></button></div><div className="p-6">{children}</div></div></div>;
}
export default Modal;