import type { Lang } from "@/lib/i18n/dictionary";

// Client-safe product/package types and pure helpers. Kept free of any db
// import so client components can use them without pulling `pg` into the bundle.

export type InstanceStatus = "available" | "active" | "consumed" | "expired";
export type ProductType = "TIMED_ENTRY" | "ADDON" | "BUNDLE" | "HOUR_PASS";

export type ChildPackage = {
  id: number;
  productSku: string;
  nameEn: string;
  nameTh: string;
  type: ProductType;
  status: InstanceStatus;
  hoursTotal: number;
  hoursRemaining: number;
  crayonCreditsRemaining: number;
  clayCreditsRemaining: number;
  extraHoursRemaining: number;
  expiresAt: string | null;
  isFamily: boolean;
};

export type HistoryItem =
  | { kind: "receipt"; id: number; receiptNo: string | null; totalThb: number; at: string }
  | { kind: "session"; id: number; at: string };

export type CatalogProduct = {
  sku: string;
  nameEn: string;
  nameTh: string;
  type: ProductType;
  priceThb: number;
};

export type CartSection = "entry" | "addons" | "packages" | "passes";

// Sell-grid grouping (UI/UX A4). EXTRA_1H is a TIMED_ENTRY but belongs with the
// creative add-ons since it's sold as a consumable credit, not a fresh entry.
export function sectionForProduct(p: { sku: string; type: ProductType }): CartSection {
  if (p.sku === "EXTRA_1H" || p.type === "ADDON") return "addons";
  if (p.type === "TIMED_ENTRY") return "entry";
  if (p.type === "BUNDLE") return "packages";
  return "passes";
}

export const SECTION_ORDER: CartSection[] = ["entry", "addons", "packages", "passes"];

// Add-on tiles carry a caption; EXTRA_1H needs a running timer to consume.
export function addonCaption(sku: string): "play" | "timer" | null {
  if (sku === "EXTRA_1H") return "timer";
  if (sku === "CRAYON" || sku === "CLAY") return "play";
  return null;
}

export function productName(p: { nameEn: string; nameTh: string }, lang: Lang): string {
  return lang === "th" ? p.nameTh : p.nameEn;
}

// Read-time expiry: an instance past its expires_at is treated as expired
// without a cron job (PRD §7.5), unless already consumed.
export function effectiveStatus(
  status: InstanceStatus,
  expiresAt: Date | null,
  now = new Date()
): InstanceStatus {
  if (status === "consumed") return "consumed";
  if (expiresAt && expiresAt.getTime() < now.getTime()) return "expired";
  return status;
}
