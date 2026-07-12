"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { StatusChip } from "./StatusChip";
import { StartSheet } from "./StartSheet";
import { RedeemSheet } from "./RedeemSheet";
import { productName, type ChildPackage } from "@/lib/product";

// Package/credit row on the Child page (A3) with its actions: Start (startable
// instances), Redeem crayon/clay, Consume +1h (blocked without a running session).
export function PackageRow({
  pkg,
  childId,
  siblings,
  activeSessionId,
}: {
  pkg: ChildPackage;
  childId: number;
  siblings: { id: number; name: string }[];
  activeSessionId: number | null;
}) {
  const { t, lang } = useLang();
  const [showStart, setShowStart] = useState(false);
  const [redeemType, setRedeemType] = useState<"crayon" | "clay" | "extra_hour" | null>(null);

  const live = pkg.status === "available" || pkg.status === "active";
  const startable = live && pkg.status === "available" && pkg.hoursRemaining > 0 && pkg.type !== "ADDON";

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

  const showCrayon = live && pkg.crayonCreditsRemaining > 0;
  const showClay = live && pkg.clayCreditsRemaining > 0;
  const showExtra = live && pkg.extraHoursRemaining > 0;
  const hasActions = startable || showCrayon || showClay || showExtra;

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

      {hasActions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {startable && (
            <button
              onClick={() => setShowStart(true)}
              className="rounded-lg bg-amber px-4 py-2 text-[13px] font-bold text-amber-ink"
            >
              {t("startPackage")}
            </button>
          )}
          {showCrayon && (
            <button
              onClick={() => setRedeemType("crayon")}
              className="rounded-lg border border-line bg-card px-3 py-2 text-[13px] font-bold text-ink"
            >
              🖍 {t("redeem")}
            </button>
          )}
          {showClay && (
            <button
              onClick={() => setRedeemType("clay")}
              className="rounded-lg border border-line bg-card px-3 py-2 text-[13px] font-bold text-ink"
            >
              🗿 {t("redeem")}
            </button>
          )}
          {showExtra && (
            <button
              onClick={() => activeSessionId && setRedeemType("extra_hour")}
              disabled={!activeSessionId}
              title={!activeSessionId ? t("extraNeedsSession") : undefined}
              className="rounded-lg border border-line bg-card px-3 py-2 text-[13px] font-bold text-ink disabled:opacity-40"
            >
              ⏱ {t("consumeExtraHour")}
            </button>
          )}
        </div>
      )}

      {showStart && (
        <StartSheet pkg={pkg} childId={childId} siblings={siblings} onClose={() => setShowStart(false)} />
      )}
      {redeemType && (
        <RedeemSheet
          pkg={pkg}
          childId={childId}
          type={redeemType}
          activeSessionId={activeSessionId}
          onClose={() => setRedeemType(null)}
        />
      )}
    </li>
  );
}
