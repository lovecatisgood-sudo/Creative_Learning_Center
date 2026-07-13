"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";

// Shared Prev/Next + page-number control. Renders nothing for a single page.
export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const { t } = useLang();
  if (totalPages <= 1) return null;
  // window of up to 5 page numbers around the current page
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const nums = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).filter(
    (n) => n >= 1 && n <= totalPages
  );
  const btn =
    "min-h-[40px] min-w-[40px] rounded-lg border border-line px-3 text-sm font-bold disabled:opacity-40";
  return (
    <nav className="flex items-center justify-center gap-1 py-3" aria-label={t("pageOf").replace("{a}", String(page)).replace("{b}", String(totalPages))}>
      <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ {t("pagePrev")}</button>
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onPage(n)}
          aria-current={n === page ? "page" : undefined}
          className={btn + (n === page ? " bg-amber text-amber-ink border-amber" : " bg-card text-ink")}
        >
          {n}
        </button>
      ))}
      <button className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>{t("pageNext")} ›</button>
    </nav>
  );
}
