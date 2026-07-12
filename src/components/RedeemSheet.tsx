"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Sheet } from "./Sheet";
import { productName, type ChildPackage } from "@/lib/product";

// A10 — Redeem credit. crayon/clay are soft (warn if no running session, allow
// override); extra_hour is hard-blocked without a running session (handled by
// the caller not opening it, and asserted server-side too).
export function RedeemSheet({
  pkg,
  childId,
  type,
  activeSessionId,
  onClose,
}: {
  pkg: ChildPackage;
  childId: number;
  type: "crayon" | "clay" | "extra_hour";
  activeSessionId: number | null;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remaining =
    type === "crayon"
      ? pkg.crayonCreditsRemaining
      : type === "clay"
        ? pkg.clayCreditsRemaining
        : pkg.extraHoursRemaining;
  const noSession = !activeSessionId;

  async function redeem() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/redemptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageInstanceId: pkg.id,
        childId,
        type,
        sessionId: activeSessionId,
      }),
    });
    setBusy(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t("required"));
    }
  }

  const title = type === "crayon" ? t("redeemCrayon") : type === "clay" ? t("redeemClay") : t("consume");

  return (
    <Sheet title={title} onClose={onClose}>
      <p className="mb-3 text-base text-ink">
        {productName(pkg, lang)} · {remaining - 1} {t("willRemain")}
      </p>
      {type !== "extra_hour" && noSession && (
        <p className="mb-3 rounded-lg bg-warnbg px-3 py-2 text-[13px] font-semibold text-warn">
          {t("noActiveSessionWarn")}
        </p>
      )}
      {error && <p className="mb-2 text-[13px] font-semibold text-danger">{error}</p>}
      <button className="btn-primary" onClick={redeem} disabled={busy}>
        {busy ? t("loading") : noSession && type !== "extra_hour" ? t("redeemAnyway") : t("confirm")}
      </button>
    </Sheet>
  );
}
