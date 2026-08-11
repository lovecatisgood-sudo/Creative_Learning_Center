export const PLAYROOM_INTEREST_OPTIONS = [
  ["playroom-general", "Kids Playroom & Creative Activities", "Kids Playroom และกิจกรรมสร้างสรรค์"],
  ["playroom-1h", "Kids Playroom — 1 hour / 149 THB", "Kids Playroom — 1 ชั่วโมง / 149 บาท"],
  ["playroom-2h", "Kids Playroom — 2 hours / 249 THB", "Kids Playroom — 2 ชั่วโมง / 249 บาท"],
  ["playroom-extra-hour", "Additional hour (after initial entry) / 80 THB", "เพิ่มเวลา 1 ชั่วโมง (หลังซื้อค่าเข้า) / 80 บาท"],
  ["playroom-extra-adult", "Additional adult / 50 THB per hour", "ผู้ใหญ่เพิ่มเติม / 50 บาทต่อชั่วโมง"],
  ["playroom-crayon", "Crayon activity / 45 THB", "กิจกรรมสีเทียน / 45 บาท"],
  ["playroom-clay-small", "Small soft-clay figure / 69 THB", "ฟิกเกอร์ดินปั้นนิ่มขนาดเล็ก / 69 บาท"],
  ["playroom-clay-large", "Large soft-clay figure / 99 THB", "ฟิกเกอร์ดินปั้นนิ่มขนาดใหญ่ / 99 บาท"],
] as const;

export const AFTERSCHOOL_INTEREST_OPTIONS = [
  ["creative-general", "After School Explorer Program", "โปรแกรม After School Explorer"],
  ["creative-1h", "After School Explorer — 1 hour / 199 THB", "After School Explorer — 1 ชั่วโมง / 199 บาท"],
  ["creative-2h", "After School Explorer — 2 hours / 300 THB", "After School Explorer — 2 ชั่วโมง / 300 บาท"],
  ["creative-half-day", "After School Explorer — 4-hour weekday option / 599 THB", "After School Explorer — ตัวเลือกวันธรรมดา 4 ชั่วโมง / 599 บาท"],
  ["creative-meal", "After School Explorer — Meal Care Add-On / 299 THB", "After School Explorer — บริการเสริมมื้ออาหาร / 299 บาท"],
  ["creative-weekday-pass", "After School Explorer — weekday pass", "After School Explorer — บัตรวันธรรมดา"],
  ["creative-homework-pass", "After School Explorer — homework & creative pass", "After School Explorer — บัตรการบ้านและกิจกรรมสร้างสรรค์"],
  ["creative-dinner-pickup-pass", "After School Explorer — dinner & late pickup pass", "After School Explorer — บัตรมื้อเย็นและรับกลับช่วงค่ำ"],
] as const;

export const PROGRAM_INTEREST_OPTIONS = [...PLAYROOM_INTEREST_OPTIONS, ...AFTERSCHOOL_INTEREST_OPTIONS] as const;
export const PROGRAM_INTEREST_VALUES = new Set<string>(PROGRAM_INTEREST_OPTIONS.map(([value]) => value));

export const PLAN_QUERY_TO_INTEREST: Record<string, string> = {
  "1h": "playroom-1h",
  "2h": "playroom-2h",
  "playroom-1h": "playroom-1h",
  "playroom-2h": "playroom-2h",
  "playroom-extra-hour": "playroom-extra-hour",
  "playroom-extra-adult": "playroom-extra-adult",
  "playroom-crayon": "playroom-crayon",
  "playroom-clay-small": "playroom-clay-small",
  "playroom-clay-large": "playroom-clay-large",
  "weekday-after-school-pass": "creative-weekday-pass",
  "homework-creative-pass": "creative-homework-pass",
  "dinner-late-pickup-pass": "creative-dinner-pickup-pass",
};
