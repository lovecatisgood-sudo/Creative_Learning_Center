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
  extendSessionId,
}: {
  catalog: CatalogProduct[];
  paymentInfo: PaymentInfo;
  initialChild: SelectedChild | null;
  initialHasRunningSession: boolean;
  extendSessionId: number | null;
}) {
  const { t } = useLang();
  const router = useRouter();

  const [child, setChild] = useState<SelectedChild | null>(initialChild);
  const [hasRunningSession, setHasRunningSession] = useState(initialHasRunningSession);
  const [changing, setChanging] = useState(!initialChild);
  // From the session "+ Add 1 hour" shortcut: preload EXTRA_1H.
  const [cart, setCart] = useState<Map<string, number>>(
    () => (extendSessionId ? new Map([["EXTRA_1H", 1]]) : new Map())
  );
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
        <p className="px-4 pt-4 text-center text-[15px] text-meta sm:px-6 md:px-8">{t("chooseChild")}</p>
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
          extendSessionId={extendSessionId}
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
      <div className="flex items-center justify-between gap-2 border-b border-line bg-card px-4 py-2.5 sm:px-6 md:px-8">
        <div className="min-w-0 text-[13px] text-meta">
          {t("sellingTo")}: <span className="font-bold text-ink">{child.name}</span>
          {child.parentName?.trim() ? ` (${child.parentName})` : ""}
        </div>
        <button onClick={() => setChanging(true)} className="shrink-0 text-[13px] font-bold text-tealdeep underline">
          {t("change")}
        </button>
      </div>

      <div className="flex-1 px-4 pb-24 sm:px-6 md:flex md:items-start md:gap-6 md:px-8 md:pb-8">
        <div className="md:min-w-0 md:flex-1">
          <ProductGrid
            catalog={catalog}
            cart={cart}
            onAdd={addToCart}
            onStep={stepCart}
            extraEnabled={hasRunningSession}
          />
        </div>

        {/* Cart summary — sits beside the grid from tablet width up, replacing
            the sticky bottom bar once there's room for it. */}
        {totalItems > 0 && (
          <aside className="sticky top-20 hidden shrink-0 md:block md:w-72">
            <div className="rounded-2xl border-2 border-teal bg-tealbg p-4">
              <div className="text-[13px] font-bold text-tealdeep">
                {totalItems} {t("itemsCount")}
              </div>
              <div className="mt-1 text-3xl font-extrabold text-ink">{total} ฿</div>
              <button className="btn-primary mt-3" onClick={() => setStep("checkout")}>
                {t("checkout")} ▶
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Sticky cart footer — phone/portrait only; the sidebar above takes over on tablet. */}
      {totalItems > 0 && (
        <div className="sticky bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur md:hidden">
          <button className="btn-primary" onClick={() => setStep("checkout")}>
            {totalItems} {t("itemsCount")} · {total} ฿ — {t("checkout")} ▶
          </button>
        </div>
      )}
    </div>
  );
}
