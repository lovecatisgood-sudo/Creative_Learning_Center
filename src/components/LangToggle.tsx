"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

// Compact TH/EN pill on every primary app bar. Shows the OTHER language.
export function LangToggle({ dark = false }: { dark?: boolean }) {
  const { toggle, lang } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle language"
      className={
        "rounded-full border px-3 py-1 text-[13px] font-bold " +
        (dark
          ? "border-cream/40 text-cream"
          : "border-line text-ink bg-card")
      }
    >
      {lang === "th" ? "EN" : "ไทย"}
    </button>
  );
}
