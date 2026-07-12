"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { productName } from "@/lib/product";
import type { ReceiptData } from "@/lib/receipt";
import { toPng } from "html-to-image";

const SHOP = process.env.NEXT_PUBLIC_SHOP_NAME || "Siamese Cat Creative Club";

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
      ? t("methodPromptpay")
      : data.method === "bank"
        ? t("methodBank")
        : t("methodCash");

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

      <div className="flex-1 px-4 py-4">
        {/* 80mm ticket */}
        <div
          ref={ticketRef}
          className="receipt-ticket mx-auto max-w-[320px] rounded-xl border border-line bg-white p-4 font-mono text-[13px] text-black"
        >
          <div className="text-center">
            <div className="font-display text-base font-extrabold">{SHOP}</div>
            <div className="mt-1 text-[12px]">{t("receipt")}</div>
          </div>
          <Divider />
          <Row label={t("receiptNo")} value={data.receiptNo ?? `#${data.orderId}`} />
          <Row label={t("dateTime")} value={dt} />
          {data.childName && <Row label={t("childName")} value={data.childName} />}
          {data.parentName && <Row label={t("parentLabel")} value={data.parentName} />}
          <Divider />
          {data.items.map((it, i) => (
            <div key={i} className="mb-1">
              <div className="flex justify-between">
                <span className="pr-2">{productName(it, lang)}</span>
                <span>{it.lineTotalThb}</span>
              </div>
              <div className="text-[11px] text-black/60">
                {it.qty} × {it.unitPriceThb}
              </div>
            </div>
          ))}
          <Divider />
          <div className="flex justify-between text-base font-extrabold">
            <span>{t("total")}</span>
            <span>{data.totalThb} ฿</span>
          </div>
          <Row label={t("paymentMethod")} value={methodLabel} />
          <Divider />
          <div className="text-center text-[12px]">{t("thankYou")} · {SHOP}</div>
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
      <div className="no-print sticky bottom-0 flex flex-col gap-2 border-t border-line bg-paper/95 p-4 backdrop-blur">
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

function Row({ label, value }: { label: string; value: string }) {
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
