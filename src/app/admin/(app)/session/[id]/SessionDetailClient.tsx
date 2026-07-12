"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Countdown, useNow, isOverdue } from "@/components/Countdown";
import { Sheet } from "@/components/Sheet";
import { bkkTimeHm } from "@/lib/time";
import { productName } from "@/lib/product";
import type { SessionDetail, Consumable } from "@/lib/sessions";
import { toPng } from "html-to-image";

const SHOP = process.env.NEXT_PUBLIC_SHOP_NAME || "Siamese Cat Creative Club";

export function SessionDetailClient({ detail, justStarted }: { detail: SessionDetail; justStarted: boolean }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const now = useNow(1000);
  const s = detail.session;
  const over = isOverdue(s.plannedEndAt, now);

  const [showEnd, setShowEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  async function consume(c: Consumable) {
    setBusy(true);
    await fetch("/api/admin/redemptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageInstanceId: c.instanceId,
        childId: s.childId,
        type: c.type,
        sessionId: s.id,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  async function saveSlip() {
    if (!slipRef.current) return;
    const url = await toPng(slipRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a");
    a.href = url;
    a.download = `pickup-${s.id}.png`;
    a.click();
  }

  const consumeLabel = (type: Consumable["type"]) =>
    type === "crayon" ? t("crayonCredit") : type === "clay" ? t("clayCredit") : t("extraHourCredit");
  const consumeIcon = (type: Consumable["type"]) => (type === "crayon" ? "🖍" : type === "clay" ? "🗿" : "⏱");

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar title={t("sessionDetail")} right={<LogoutButton />} />

      <div className="flex-1 px-4 py-4">
        {/* Pickup slip / hero (also the printable A8 slip) */}
        <div
          ref={slipRef}
          className="receipt-ticket rounded-2xl border-2 border-teal bg-tealbg p-5 text-center"
        >
          {justStarted && <div className="mb-1 text-[13px] font-bold text-tealdeep">{t("sessionStarted")}</div>}
          <div className="text-2xl font-extrabold text-ink">{s.childName}</div>
          <div className="mt-0.5 text-[13px] text-meta">{lang === "th" ? s.nameTh : s.nameEn}</div>
          <div className="mt-3 text-[13px] text-meta">
            {t("start")} {bkkTimeHm(new Date(s.startedAt))}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-meta">{t("pickup")}</div>
          <div className="text-[44px] font-extrabold leading-none text-tealdeep">
            {bkkTimeHm(new Date(s.plannedEndAt))}
          </div>
          {s.isHourPass && (
            <div className="mt-2 text-[13px] text-meta">
              {t("hoursRemaining")}: <span className="font-bold text-ink">{s.hoursRemaining}</span>
            </div>
          )}
          <div className="mt-3">
            <Countdown
              plannedEndAt={s.plannedEndAt}
              now={now}
              overdueLabel={t("overdue")}
              className="text-3xl font-extrabold tabular-nums"
            />
          </div>
        </div>

        {justStarted && (
          <div className="no-print mt-3 flex gap-2">
            <button className="btn-ghost" onClick={() => window.print()}>
              🖨 {t("printSlip")}
            </button>
            <button className="btn-ghost" onClick={saveSlip}>
              ⬇ {t("saveImage")}
            </button>
          </div>
        )}

        {over && (
          <div className="no-print mt-3 rounded-xl bg-warnbg px-4 py-3 text-[13px] font-semibold text-warn">
            {t("overdueBanner")}
          </div>
        )}

        {/* Consumables strip */}
        <div className="no-print mt-5">
          <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-meta">{t("consumablesTitle")}</h3>
          {detail.consumables.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-card/50 p-3 text-center text-[13px] text-meta">
              —
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {detail.consumables.map((c) => (
                <li
                  key={`${c.instanceId}-${c.type}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-card p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-ink">
                      {consumeIcon(c.type)} {consumeLabel(c.type)}
                    </div>
                    <div className="text-[13px] text-meta">
                      {productName(c, lang)} · {c.remaining} {t("left")}
                    </div>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => consume(c)}
                    className="shrink-0 rounded-lg bg-tealdeep px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
                  >
                    {t("consume")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="no-print sticky bottom-0 flex flex-col gap-2 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <button
          className="btn-ghost"
          onClick={() => router.push(`/admin/sell?childId=${s.childId}&extendSession=${s.id}`)}
        >
          ＋ {t("addOneHour")} (100 ฿)
        </button>
        <button className="btn-primary bg-danger text-white" onClick={() => setShowEnd(true)}>
          {t("endSession")}
        </button>
      </div>

      {showEnd && (
        <EndSessionSheet
          detail={detail}
          now={now}
          onClose={() => setShowEnd(false)}
          onEnded={() => router.push("/admin/sessions")}
        />
      )}
    </div>
  );
}

function EndSessionSheet({
  detail,
  now,
  onClose,
  onEnded,
}: {
  detail: SessionDetail;
  now: number;
  onClose: () => void;
  onEnded: () => void;
}) {
  const { t } = useLang();
  const s = detail.session;

  // Suggested refund = booked − whole elapsed hours, pass only (mirrors server).
  const wholeElapsed = Math.floor((now - new Date(s.startedAt).getTime()) / 3_600_000);
  const suggested = Math.max(0, s.hoursBooked - wholeElapsed);
  const [refund, setRefund] = useState(suggested);
  const [busy, setBusy] = useState(false);

  async function end() {
    setBusy(true);
    await fetch(`/api/admin/sessions/${s.id}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s.isHourPass ? { refundHours: refund } : {}),
    });
    setBusy(false);
    onEnded();
  }

  if (!s.isHourPass) {
    return (
      <Sheet title={t("endConfirmTitle")} onClose={onClose}>
        <p className="mb-4 text-base text-ink">
          {t("endConfirmTimed")} <span className="font-bold">{s.childName}</span>?
        </p>
        <button className="btn-primary bg-danger text-white" onClick={end} disabled={busy}>
          {busy ? t("loading") : t("endSession")}
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet title={t("refundTitle")} onClose={onClose}>
      <p className="mb-3 text-base text-ink">
        {t("booked")} {s.hoursBooked}h · {t("used")} {Math.max(0, s.hoursBooked - refund)}h. {t("refundQuestion")}
      </p>
      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setRefund((r) => Math.max(0, r - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-tealdeep text-2xl text-white"
        >
          −
        </button>
        <span className="min-w-[48px] text-center text-4xl font-extrabold text-ink">{refund}</span>
        <button
          onClick={() => setRefund((r) => Math.min(suggested, r + 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-tealdeep text-2xl text-white disabled:opacity-40"
          disabled={refund >= suggested}
        >
          +
        </button>
      </div>
      <button className="btn-primary" onClick={end} disabled={busy}>
        {busy ? t("loading") : `${t("confirmEndRefund")} ${refund}h`}
      </button>
    </Sheet>
  );
}
