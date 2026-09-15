import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, testid }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" data-testid={`${testid}-backdrop`} onMouseDown={(e) => e.target === ref.current && onClose()} ref={ref}>
      <div className="modal-card" data-testid={testid}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close" data-testid={`${testid}-close`}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
