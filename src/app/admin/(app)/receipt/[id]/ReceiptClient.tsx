"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { ReceiptData } from "@/lib/receipt";
import { toPng } from "html-to-image";
import { dict } from "@/lib/i18n/dictionary";

const SHOP = process.env.NEXT_PUBLIC_SHOP_NAME || "Siamese Cat Creative Club";
const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || "Siamese Cat Cafe Co., Ltd.";

// The printed ticket always shows Thai + English together, independent of the
// app's language toggle (`lang`), which only affects on-screen chrome (AppBar,
// buttons) via `t()`.
const bi = (k: keyof typeof dict) => `${dict[k].th} / ${dict[k].en}`;

export function ReceiptClient({ data, justPaid }: { data: ReceiptData; justPaid: boolean }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [showProof, setShowProof] = useState(false);
  const [saving, setSaving] = useState(false);

  const dt = new Date(data.createdAt).toLocaleString(lang === "th" ? "th-TH" : "en-GB", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const methodLabel =
    data.method === "promptpay"
      ? bi("methodPromptpay")
      : data.method === "bank"
        ? bi("methodBank")
        : bi("methodCash");

  async function saveAsImage() {
    if (!ticketRef.current) return;
    setSaving(true);
    try {
      const url = await toPng(ticketRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.receiptNo ?? "receipt"}.png`;
      a.click();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar title={t("receipt")} right={<LogoutButton />} />

      {/* On-screen wrapper only — kept as a centered, phone-width column even
          inside the wider tablet shell, since the ticket itself stays a fixed
          80mm-proportioned card. The .receipt-ticket contents + @media print
          rules are untouched (Task 10 owns the ticket content). */}
      <div className="mx-auto flex w-full max-w-app flex-1 flex-col px-4 py-4">
        {/* 80mm ticket */}
        <div
          ref={ticketRef}
          className="receipt-ticket mx-auto max-w-[320px] rounded-xl border border-line bg-white p-4 font-mono text-[13px] text-black"
        >
          <div className="text-center">
            <div className="font-display text-base font-extrabold">{SHOP}</div>
            <div className="text-[11px] text-black/70">{COMPANY}</div>
            <div className="mt-1 text-[12px]">{bi("receipt")}</div>
          </div>
          <Divider />
          <Row label={bi("receiptNo")} value={data.receiptNo ?? `#${data.orderId}`} />
          <Row label={bi("dateTime")} value={dt} stack />
          {data.childName && <Row label={bi("childName")} value={data.childName} stack />}
          {data.parentName && <Row label={bi("parentLabel")} value={data.parentName} stack />}
          <Divider />
          {data.items.map((it, i) => (
            <div key={i} className="mb-1">
              <div className="flex justify-between">
                <span className="pr-2">
                  {it.nameTh} / {it.nameEn}
                </span>
                <span>{it.lineTotalThb}</span>
              </div>
              <div className="text-[11px] text-black/60">
                {it.qty} × {it.unitPriceThb}
              </div>
            </div>
          ))}
          <Divider />
          <div className="flex justify-between text-base font-extrabold">
            <span>{bi("total")}</span>
            <span>{data.totalThb} ฿</span>
          </div>
          <Row label={bi("paymentMethod")} value={methodLabel} stack />
          <Divider />
          <div className="text-center text-[12px]">{bi("thankYou")} · {SHOP}</div>
        </div>

        {/* Proof thumbnail (not printed) */}
        {data.proofKey && (
          <div className="no-print mt-4 text-center">
            <button onClick={() => setShowProof(true)} className="text-[13px] font-semibold text-tealdeep underline">
              {t("viewProof")}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="no-print sticky bottom-0 mx-auto flex w-full max-w-app flex-col gap-2 border-t border-line bg-paper/95 p-4 backdrop-blur">
        {justPaid && data.hasStartable && data.childId && (
          <button className="btn-primary" onClick={() => router.push(`/admin/child/${data.childId}`)}>
            {t("startNow")} ▶
          </button>
        )}
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => window.print()}>
            🖨 {t("print")}
          </button>
          <button className="btn-ghost" onClick={saveAsImage} disabled={saving}>
            {saving ? t("loading") : `⬇ ${t("saveImage")}`}
          </button>
        </div>
        <button
          className="text-center text-[13px] font-semibold text-meta"
          onClick={() => router.push(data.childId ? `/admin/child/${data.childId}` : "/admin/sessions")}
        >
          {t("done")}
        </button>
      </div>

      {/* Proof full-screen */}
      {showProof && data.proofKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowProof(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/admin/proof/${data.proofKey}`} alt={t("paymentProof")} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

// `stack` puts the (now-bilingual, longer) label on its own line above the
// value instead of side-by-side, so rows with a long Thai/English label pair
// don't overflow the 72mm ticket width.
function Row({ label, value, stack }: { label: string; value: string; stack?: boolean }) {
  if (stack) {
    return (
      <div className="mb-1">
        <div className="text-black/60">{label}</div>
        <div className="text-right font-semibold">{value}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-between gap-2">
      <span className="text-black/60">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
function Divider() {
  return <div className="my-2 border-t border-dashed border-black/30" />;
}
