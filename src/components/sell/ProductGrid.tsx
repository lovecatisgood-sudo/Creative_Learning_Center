"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  productName,
  sectionForProduct,
  addonCaption,
  SECTION_ORDER,
  type CatalogProduct,
  type CartSection,
} from "@/lib/product";
import type { DictKey } from "@/lib/i18n/dictionary";

const SECTION_LABEL: Record<CartSection, DictKey> = {
  entry: "secEntry",
  addons: "secAddons",
  packages: "secPackages",
  passes: "secPasses",
};

// A4 product grid: 2 columns, grouped by section. Tap a tile to add; the qty
// badge steps up. EXTRA_1H is disabled unless the child has a running session.
export function ProductGrid({
  catalog,
  cart,
  onAdd,
  onStep,
  extraEnabled,
}: {
  catalog: CatalogProduct[];
  cart: Map<string, number>;
  onAdd: (sku: string) => void;
  onStep: (sku: string, delta: number) => void;
  extraEnabled: boolean;
}) {
  const { t, lang } = useLang();

  const grouped = SECTION_ORDER.map((section) => ({
    section,
    items: catalog.filter((p) => sectionForProduct(p) === section),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5 px-4 py-3">
      {grouped.map(({ section, items }) => (
        <div key={section}>
          <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-meta">
            {t(SECTION_LABEL[section])}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {items.map((p) => {
              const qty = cart.get(p.sku) ?? 0;
              const caption = addonCaption(p.sku);
              const disabled = p.sku === "EXTRA_1H" && !extraEnabled;
              return (
                <div
                  key={p.sku}
                  className={
                    "relative flex min-h-[84px] flex-col justify-between rounded-xl border-2 p-3 " +
                    (qty > 0 ? "border-teal bg-tealbg" : "border-line bg-card") +
                    (disabled ? " opacity-40" : "")
                  }
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onAdd(p.sku)}
                    className="flex-1 text-left"
                  >
                    <div className="text-[15px] font-bold leading-tight text-ink">{productName(p, lang)}</div>
                    {caption && (
                      <div className="mt-0.5 text-[11px] text-meta">
                        {disabled ? t("extraNeedsSession") : t(caption === "timer" ? "captionTimer" : "captionPlay")}
                      </div>
                    )}
                  </button>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[15px] font-extrabold text-amber-ink">{p.priceThb}</span>
                    {qty > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onStep(p.sku, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-brown text-cream"
                          aria-label="decrease"
                        >
                          −
                        </button>
                        <span className="min-w-[18px] text-center text-base font-bold text-ink">{qty}</span>
                        <button
                          onClick={() => onStep(p.sku, 1)}
                          disabled={disabled}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-brown text-cream"
                          aria-label="increase"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
