"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Sheet } from "./Sheet";
import { productName, type ChildPackage } from "@/lib/product";
import { bkkTimeHm } from "@/lib/time";

// A7 — Start config. HOUR_PASS gets an hours stepper (1..min(remaining,12)) and,
// for a shareable family pass, a sibling selector. Timed/bundle just confirm.
export function StartSheet({
  pkg,
  childId,
  siblings,
  onClose,
}: {
  pkg: ChildPackage;
  childId: number;
  siblings: { id: number; name: string }[];
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const isPass = pkg.type === "HOUR_PASS";
  const cap = Math.min(pkg.hoursRemaining || 0, 12);

  const [useChild, setUseChild] = useState(childId);
  const [hours, setHours] = useState(isPass ? Math.min(1, cap) || 1 : pkg.hoursTotal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pickupPreview = useMemo(() => {
    const bookedH = isPass ? hours : pkg.hoursTotal;
    return bkkTimeHm(new Date(Date.now() + bookedH * 3_600_000));
  }, [hours, isPass, pkg.hoursTotal]);

  async function start() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageInstanceId: pkg.id,
        childId: useChild,
        hours: isPass ? hours : undefined,
      }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/session/${data.sessionId}?started=1`);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t("required"));
    }
  }

  return (
    <Sheet title={t("startTitle")} onClose={onClose}>
      <div className="mb-3 rounded-xl border border-line bg-card p-3">
        <div className="font-bold text-ink">{productName(pkg, lang)}</div>
      </div>

      {/* Family pass: choose which sibling uses it */}
      {isPass && pkg.isFamily && siblings.length > 1 && (
        <div className="mb-4">
          <div className="mb-1 text-[13px] font-semibold text-meta">{t("chooseSibling")}</div>
          <div className="flex flex-wrap gap-2">
            {siblings.map((sib) => (
              <button
                key={sib.id}
                onClick={() => setUseChild(sib.id)}
                className={
                  "rounded-xl border-2 px-3 py-2 text-[15px] font-semibold " +
                  (useChild === sib.id ? "border-teal bg-tealbg text-tealdeep" : "border-line bg-card text-ink")
                }
              >
                {sib.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hour stepper for passes */}
      {isPass && (
        <div className="mb-4">
          <div className="mb-1 text-[13px] font-semibold text-meta">{t("hoursToUse")}</div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setHours((h) => Math.max(1, h - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-tealdeep text-2xl text-white"
            >
              −
            </button>
            <span className="min-w-[48px] text-center text-4xl font-extrabold text-ink">{hours}</span>
            <button
              onClick={() => setHours((h) => Math.min(cap, h + 1))}
              disabled={hours >= cap}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-tealdeep text-2xl text-white disabled:opacity-40"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-center text-[13px] text-meta">
            {t("pickupAt")} {pickupPreview} · {pkg.hoursRemaining - hours} {t("hoursShort")} {t("willRemain")}
          </p>
        </div>
      )}

      {!isPass && (
        <p className="mb-4 text-center text-base text-ink">
          {t("pickupAt")} <span className="font-extrabold">{pickupPreview}</span>
        </p>
      )}

      {error && <p className="mb-2 text-[13px] font-semibold text-danger">{error}</p>}
      <button className="btn-primary" onClick={start} disabled={busy}>
        {busy ? t("loading") : t("startSession")}
      </button>
    </Sheet>
  );
}
