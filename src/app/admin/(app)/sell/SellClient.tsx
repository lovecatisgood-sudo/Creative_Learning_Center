"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { ProductGrid } from "@/components/sell/ProductGrid";
import { ChildPicker, type PickedChild } from "@/components/sell/ChildPicker";
import { CheckoutView } from "@/components/sell/CheckoutView";
import type { CatalogProduct } from "@/lib/product";
import type { PaymentInfo } from "@/lib/catalog";

type SelectedChild = { id: number; name: string; parentName: string };

export function SellClient({
  catalog,
  paymentInfo,
  initialChild,
  initialHasRunningSession,
}: {
  catalog: CatalogProduct[];
  paymentInfo: PaymentInfo;
  initialChild: SelectedChild | null;
  initialHasRunningSession: boolean;
}) {
  const { t } = useLang();
  const router = useRouter();

  const [child, setChild] = useState<SelectedChild | null>(initialChild);
  const [hasRunningSession, setHasRunningSession] = useState(initialHasRunningSession);
  const [changing, setChanging] = useState(!initialChild);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  const totalItems = Array.from(cart.values()).reduce((a, b) => a + b, 0);
  const total = Array.from(cart.entries()).reduce((sum, [sku, qty]) => {
    const p = catalog.find((c) => c.sku === sku);
    return sum + (p ? p.priceThb * qty : 0);
  }, 0);

  function addToCart(sku: string) {
    setCart((prev) => new Map(prev).set(sku, (prev.get(sku) ?? 0) + 1));
  }
  function stepCart(sku: string, delta: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const q = (next.get(sku) ?? 0) + delta;
      if (q <= 0) next.delete(sku);
      else next.set(sku, q);
      return next;
    });
  }

  function pickChild(c: PickedChild) {
    setChild({ id: c.id, name: c.name, parentName: c.parentName });
    setHasRunningSession(c.hasRunningSession);
    setChanging(false);
    // EXTRA_1H may have become invalid for the new child; drop it if disabled.
    if (!c.hasRunningSession) {
      setCart((prev) => {
        if (!prev.has("EXTRA_1H")) return prev;
        const next = new Map(prev);
        next.delete("EXTRA_1H");
        return next;
      });
    }
  }

  // ── Child not chosen yet, or changing ──
  if (!child || changing) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppBar title={t("navSell")} right={<LogoutButton />} />
        <p className="px-4 pt-4 text-center text-[15px] text-meta">{t("chooseChild")}</p>
        <ChildPicker onPick={pickChild} />
      </div>
    );
  }

  // ── Checkout step ──
  if (step === "checkout") {
    return (
      <div className="flex min-h-screen flex-col">
        <AppBar
          title={t("checkout")}
          right={
            <button onClick={() => setStep("cart")} className="text-cream underline">
              {t("back")}
            </button>
          }
        />
        <CheckoutView
          childId={child.id}
          cart={cart}
          catalog={catalog}
          paymentInfo={paymentInfo}
          onConfirmed={(orderId) => router.push(`/admin/receipt/${orderId}?justPaid=1`)}
        />
      </div>
    );
  }

  // ── Cart step ──
  return (
    <div className="flex min-h-screen flex-col">
      <AppBar title={t("navSell")} right={<LogoutButton />} />

      {/* Selected-child bar */}
      <div className="flex items-center justify-between gap-2 border-b border-line bg-card px-4 py-2.5">
        <div className="min-w-0 text-[13px] text-meta">
          {t("sellingTo")}: <span className="font-bold text-ink">{child.name}</span>
          {child.parentName?.trim() ? ` (${child.parentName})` : ""}
        </div>
        <button onClick={() => setChanging(true)} className="shrink-0 text-[13px] font-bold text-tealdeep underline">
          {t("change")}
        </button>
      </div>

      <div className="flex-1 pb-24">
        <ProductGrid
          catalog={catalog}
          cart={cart}
          onAdd={addToCart}
          onStep={stepCart}
          extraEnabled={hasRunningSession}
        />
      </div>

      {/* Sticky cart footer */}
      {totalItems > 0 && (
        <div className="sticky bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur">
          <button className="btn-primary" onClick={() => setStep("checkout")}>
            {totalItems} {t("itemsCount")} · {total} ฿ — {t("checkout")} ▶
          </button>
        </div>
      )}
    </div>
  );
}
