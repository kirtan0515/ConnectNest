import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal dialog: traps focus, closes on Escape or backdrop click, restores focus on close. */
const EventDialog = ({ title, titleId, onClose, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const first = node?.querySelector(FOCUSABLE);
    (first || node)?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="ecal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="ecal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={ref}
      >
        <div className="ecal-dialog__head">
          <h2 id={titleId} className="ecal-dialog__title">{title}</h2>
          <button type="button" className="ecal-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <div className="ecal-dialog__body">{children}</div>
      </div>
    </div>
  );
};

export default EventDialog;
