import type { ProductGrants } from "@/db/schema";

export type CatalogProduct = {
  sku: string;
  nameEn: string;
  nameTh: string;
  type: "TIMED_ENTRY" | "ADDON" | "BUNDLE" | "HOUR_PASS";
  priceThb: number;
  grants: ProductGrants;
};

// Playroom and After School are intentionally separate products. Their
// one-hour and two-hour prices must never share a SKU again.
export const CURRENT_PRODUCT_CATALOG: CatalogProduct[] = [
  { sku: "PLAYROOM_ENTRY_1H", nameEn: "Kids Playroom — 1-Hour Entry", nameTh: "Kids Playroom — เข้าเล่น 1 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 149, grants: { hours: 1 } },
  { sku: "PLAYROOM_ENTRY_2H", nameEn: "Kids Playroom — 2-Hour Entry", nameTh: "Kids Playroom — เข้าเล่น 2 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 249, grants: { hours: 2 } },
  { sku: "PLAYROOM_EXTRA_1H", nameEn: "Kids Playroom — Additional Hour", nameTh: "Kids Playroom — เพิ่มเวลา 1 ชั่วโมง", type: "ADDON", priceThb: 80, grants: { hours: 1, extendOnly: true } },
  { sku: "PLAYROOM_EXTRA_ADULT_1H", nameEn: "Kids Playroom — Additional Adult (per hour)", nameTh: "Kids Playroom — ผู้ใหญ่เพิ่มเติม (ต่อชั่วโมง)", type: "ADDON", priceThb: 50, grants: { receiptOnly: true } },
  { sku: "PLAYROOM_CRAYON_ACTIVITY", nameEn: "Kids Playroom — Crayon Activity", nameTh: "Kids Playroom — กิจกรรมสีเทียน", type: "ADDON", priceThb: 45, grants: { receiptOnly: true } },
  { sku: "PLAYROOM_CLAY_SMALL", nameEn: "Kids Playroom — Small Soft-Clay Figure", nameTh: "Kids Playroom — ฟิกเกอร์ดินปั้นนิ่มขนาดเล็ก", type: "ADDON", priceThb: 69, grants: { receiptOnly: true } },
  { sku: "PLAYROOM_CLAY_LARGE", nameEn: "Kids Playroom — Large Soft-Clay Figure", nameTh: "Kids Playroom — ฟิกเกอร์ดินปั้นนิ่มขนาดใหญ่", type: "ADDON", priceThb: 99, grants: { receiptOnly: true } },
  { sku: "AFTERSCHOOL_ENTRY_1H", nameEn: "After School Explorer — 1 Hour", nameTh: "After School Explorer — 1 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 199, grants: { hours: 1 } },
  { sku: "AFTERSCHOOL_ENTRY_2H", nameEn: "After School Explorer — 2 Hours", nameTh: "After School Explorer — 2 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 300, grants: { hours: 2 } },
  { sku: "AFTERSCHOOL_HALF_DAY_4H", nameEn: "After School Explorer — 4-Hour Weekday Option", nameTh: "After School Explorer — ตัวเลือกวันธรรมดา 4 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 599, grants: { hours: 4 } },
  { sku: "MEAL_AFTERSCHOOL", nameEn: "After School Meal Care Add-On", nameTh: "Meal Care หลังเลิกเรียน", type: "ADDON", priceThb: 299, grants: { receiptOnly: true } },
];

export const RETIRED_PLAYGROUP_SKUS = [
  "ENTRY_1H",
  "ENTRY_2H",
  "PLAYGROUP_HALF_DAY_WD",
  "PLAYGROUP_FULL_DAY_WD",
  "PLAYGROUP_FULL_DAY_SAT",
  "PLAYGROUP_FULL_DAY_SUN",
  "MEAL_PLAYGROUP",
  "PASS_PLAYGROUP_WD_20",
  "PASS_PLAYGROUP_SAT_8",
  "PASS_PLAYGROUP_SUN_8",
  "EXTRA_1H",
  "CRAYON",
  "CLAY",
  "PKG_1H_CRAYON",
  "PKG_1H_2CLAY",
  "PKG_2H_CRAYON",
  "PKG_2H_4CLAY",
] as const;
