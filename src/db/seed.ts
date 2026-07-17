import "./env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { products, type ProductGrants } from "./schema";
import { sql } from "drizzle-orm";

// Current public package set. Products are config, not code — this script is
// idempotent (upsert on SKU) and deactivates older retired SKUs before seeding.
type SeedProduct = {
  sku: string;
  nameEn: string;
  nameTh: string;
  type: "TIMED_ENTRY" | "ADDON" | "BUNDLE" | "HOUR_PASS";
  priceThb: number;
  grants: ProductGrants;
};

const CATALOG: SeedProduct[] = [
  { sku: "ENTRY_1H", nameEn: "1-Hour Playroom Entry", nameTh: "เข้าเล่น 1 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 199, grants: { hours: 1 } },
  { sku: "ENTRY_2H", nameEn: "2-Hour Session", nameTh: "เซสชัน 2 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 300, grants: { hours: 2 } },
  { sku: "PLAYGROUP_HALF_DAY_WD", nameEn: "Weekday Half-Day Playgroup", nameTh: "เพลย์กรุ๊ปครึ่งวันธรรมดา", type: "TIMED_ENTRY", priceThb: 599, grants: { hours: 4 } },
  { sku: "PLAYGROUP_FULL_DAY_WD", nameEn: "Weekday Full-Day Playgroup", nameTh: "เพลย์กรุ๊ปเต็มวันธรรมดา", type: "TIMED_ENTRY", priceThb: 999, grants: { hours: 8 } },
  { sku: "PLAYGROUP_FULL_DAY_SAT", nameEn: "Saturday Full-Day Playgroup", nameTh: "เพลย์กรุ๊ปเต็มวันเสาร์", type: "TIMED_ENTRY", priceThb: 1500, grants: { hours: 8 } },
  { sku: "PLAYGROUP_FULL_DAY_SUN", nameEn: "Sunday Full-Day Playgroup", nameTh: "เพลย์กรุ๊ปเต็มวันอาทิตย์", type: "TIMED_ENTRY", priceThb: 1500, grants: { hours: 8 } },
  { sku: "AFTERSCHOOL_HALF_DAY_4H", nameEn: "Weekday After School Half-Day", nameTh: "หลังเลิกเรียนครึ่งวันธรรมดา", type: "TIMED_ENTRY", priceThb: 599, grants: { hours: 4 } },
  { sku: "MEAL_PLAYGROUP", nameEn: "Playgroup Meal Care Value", nameTh: "มูลค่า Meal Care เพลย์กรุ๊ป", type: "ADDON", priceThb: 250, grants: { receiptOnly: true } },
  { sku: "MEAL_AFTERSCHOOL", nameEn: "After School Meal Care Add-On", nameTh: "Meal Care หลังเลิกเรียน", type: "ADDON", priceThb: 299, grants: { receiptOnly: true } },
  { sku: "PASS_PLAYGROUP_WD_20", nameEn: "20-Session Weekday Full-Day Pass", nameTh: "บัตรเต็มวันธรรมดา 20 ครั้ง", type: "HOUR_PASS", priceThb: 18000, grants: { hours: 160, shareable: false } },
  { sku: "PASS_PLAYGROUP_SAT_8", nameEn: "8-Session Saturday Full-Day Pass", nameTh: "บัตรเต็มวันเสาร์ 8 ครั้ง", type: "HOUR_PASS", priceThb: 9200, grants: { hours: 64, shareable: false } },
  { sku: "PASS_PLAYGROUP_SUN_8", nameEn: "8-Session Sunday Full-Day Pass", nameTh: "บัตรเต็มวันอาทิตย์ 8 ครั้ง", type: "HOUR_PASS", priceThb: 9200, grants: { hours: 64, shareable: false } },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const db = drizzle(pool);

  console.log(`Seeding ${CATALOG.length} current products…`);
  await db.update(products).set({ active: false });
  for (const p of CATALOG) {
    await db
      .insert(products)
      .values({ ...p, active: true })
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          nameEn: p.nameEn,
          nameTh: p.nameTh,
          type: p.type,
          priceThb: p.priceThb,
          grants: p.grants,
          active: true,
        },
      });
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);
  console.log(`Done. Products in catalog: ${count}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
