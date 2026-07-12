"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { StatusChip } from "./StatusChip";
import { productName, type ChildPackage } from "@/lib/product";

// Read-only package/credit row on the Child page (A3). Start / Redeem / Consume
// action buttons are layered on in M4 once the session engine exists.
export function PackageRow({ pkg }: { pkg: ChildPackage }) {
  const { t, lang } = useLang();

  // Remaining-credit summary line, e.g. "hrs 23/30 · crayon 4 · clay 2".
  const parts: string[] = [];
  if (pkg.hoursTotal > 0) parts.push(`${t("hoursShort")} ${pkg.hoursRemaining}/${pkg.hoursTotal}`);
  if (pkg.crayonCreditsRemaining > 0) parts.push(`${t("crayonShort")} ${pkg.crayonCreditsRemaining}`);
  if (pkg.clayCreditsRemaining > 0) parts.push(`${t("clayShort")} ${pkg.clayCreditsRemaining}`);
  if (pkg.extraHoursRemaining > 0) parts.push(`+${pkg.extraHoursRemaining}h`);
  if (pkg.expiresAt) {
    const d = new Date(pkg.expiresAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
    parts.push(`${t("expShort")} ${d}`);
  }

  return (
    <li className="rounded-xl border border-line bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-bold text-ink">{productName(pkg, lang)}</div>
          {parts.length > 0 && <div className="mt-0.5 text-[13px] text-meta">{parts.join(" · ")}</div>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusChip status={pkg.status} />
          {pkg.isFamily && <StatusChip status="family" />}
        </div>
      </div>
    </li>
  );
}
