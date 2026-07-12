"use client";

import { useEffect } from "react";

// Bottom modal sheet used for quick-add, complete-parent, redeem, confirm, etc.
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 mx-auto w-full max-w-app rounded-t-3xl border-t border-line bg-paper p-5 pb-8">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-meta">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
