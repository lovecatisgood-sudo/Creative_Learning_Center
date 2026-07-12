"use client";

import { useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { productName, type CatalogProduct } from "@/lib/product";
import type { PaymentInfo } from "@/lib/catalog";
import { compressImage } from "@/lib/imageCompress";
import { Sheet } from "@/components/Sheet";

type Method = "promptpay" | "bank" | "cash";

export function CheckoutView({
  childId,
  cart,
  catalog,
  paymentInfo,
  extendSessionId,
  onConfirmed,
}: {
  childId: number;
  cart: Map<string, number>;
  catalog: CatalogProduct[];
  paymentInfo: PaymentInfo;
  extendSessionId?: number | null;
  onConfirmed: (orderId: number, receiptNo: string) => void;
}) {
  const { t, lang } = useLang();
  const bySku = useMemo(() => new Map(catalog.map((p) => [p.sku, p])), [catalog]);
  const lines = useMemo(
    () => Array.from(cart.entries()).map(([sku, qty]) => ({ product: bySku.get(sku)!, qty })),
    [cart, bySku]
  );
  const total = lines.reduce((s, l) => s + l.product.priceThb * l.qty, 0);

  const [method, setMethod] = useState<Method>("promptpay");
  const [proofKey, setProofKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const blob = await compressImage(file);
      const form = new FormData();
      form.append("file", blob, "proof.jpg");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("upload failed");
      const { key } = await res.json();
      setProofKey(key);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError(t("proofRequired"));
    } finally {
      setUploading(false);
    }
  }

  async function confirm() {
    setConfirming(true);
    setError("");
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId,
        method,
        proofKey,
        extendSessionId: extendSessionId ?? null,
        items: lines.map((l) => ({ sku: l.product.sku, qty: l.qty })),
      }),
    });
    setConfirming(false);
    setShowConfirm(false);
    if (res.ok) {
      const data = await res.json();
      onConfirmed(data.orderId, data.receiptNo);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t("proofRequired"));
    }
  }

  const methodLabel = (m: Method) =>
    m === "promptpay" ? t("methodPromptpay") : m === "bank" ? t("methodBank") : t("methodCash");

  return (
    <div className="flex flex-col pb-28">
      {/* Order summary */}
      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-col gap-1">
          {lines.map((l) => (
            <div key={l.product.sku} className="flex justify-between text-[13px] text-ink">
              <span>
                {productName(l.product, lang)} × {l.qty}
              </span>
              <span>{l.product.priceThb * l.qty}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
          <span className="text-base font-bold text-ink">{t("total")}</span>
          <span className="text-[40px] font-extrabold leading-none text-ink">{total}</span>
        </div>
      </div>

      {/* Method tabs */}
      <div className="flex border-b border-line">
        {(["promptpay", "bank", "cash"] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={
              "flex-1 border-b-2 py-3 text-[15px] font-bold transition " +
              (method === m ? "border-teal text-ink" : "border-transparent text-meta")
            }
          >
            {methodLabel(m)}
          </button>
        ))}
      </div>

      {/* Method body */}
      <div className="px-4 py-5">
        {method === "promptpay" && (
          <div className="flex flex-col items-center gap-3">
            {/* Static shop PromptPay QR (public/promptpay.jpg). Amount shown below;
                customer enters it when scanning. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/promptpay.jpg"
              alt="PromptPay QR"
              className="h-72 w-72 rounded-xl bg-white object-contain p-2"
            />
            <p className="text-[15px] font-semibold text-meta">
              {t("scanToPay")} {total} ฿
            </p>
          </div>
        )}

        {method === "bank" && (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
            <Detail label={t("bankNameLabel")} value={paymentInfo.bankName} />
            <Detail label={t("accountName")} value={paymentInfo.bankAccountName} />
            <div>
              <div className="text-[13px] font-semibold text-meta">{t("accountNumber")}</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl font-extrabold tracking-wide text-ink">
                  {paymentInfo.bankAccountNumber}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(paymentInfo.bankAccountNumber);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="rounded-lg bg-brown px-3 py-1.5 text-[13px] font-bold text-cream"
                >
                  {copied ? t("copied") : t("copy")}
                </button>
              </div>
            </div>
          </div>
        )}

        {method === "cash" && (
          <div className="py-6 text-center">
            <div className="text-[15px] font-semibold text-meta">{t("collect")}</div>
            <div className="text-[56px] font-extrabold leading-none text-ink">{total} ฿</div>
          </div>
        )}
      </div>

      {/* Proof step */}
      <div className="px-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFile}
        />
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="proof" className="max-h-56 w-full rounded-xl object-contain" />
            <button
              onClick={() => {
                setProofKey(null);
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-[13px] font-bold text-white"
            >
              ✕ {t("retake")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex min-h-[96px] w-full items-center justify-center rounded-xl border-2 border-dashed border-line bg-card text-[15px] font-semibold text-meta"
          >
            {uploading ? t("uploading") : t("takePhoto")}
          </button>
        )}
        {error && <p className="mt-2 text-[13px] font-semibold text-danger">{error}</p>}
      </div>

      {/* Confirm footer */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-app border-t border-line bg-paper/95 p-4 backdrop-blur">
        <button
          disabled={!proofKey || uploading}
          onClick={() => setShowConfirm(true)}
          className={
            "flex min-h-[52px] w-full items-center justify-center rounded-xl px-4 text-lg font-bold transition disabled:opacity-40 " +
            (proofKey ? "bg-ok text-white" : "bg-amber text-amber-ink")
          }
        >
          {t("confirmPayment")}
        </button>
        {!proofKey && <p className="mt-1 text-center text-[13px] text-meta">{t("proofRequired")}</p>}
      </div>

      {showConfirm && (
        <Sheet title={t("confirmSheetTitle")} onClose={() => setShowConfirm(false)}>
          <p className="mb-4 text-lg text-ink">
            <span className="font-extrabold">{total} ฿</span> {t("via")} {methodLabel(method)}
          </p>
          <button className="btn-primary" onClick={confirm} disabled={confirming}>
            {confirming ? t("loading") : t("confirm")}
          </button>
        </Sheet>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-meta">{label}</div>
      <div className="text-lg font-bold text-ink">{value || "—"}</div>
    </div>
  );
}
