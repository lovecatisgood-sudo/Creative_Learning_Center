import "./env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { products, type ProductGrants } from "./schema";
import { sql } from "drizzle-orm";

// The 11 products, verbatim from PRD §4. Products are config, not code — this
// script is idempotent (upsert on SKU) so re-running never duplicates rows.
type SeedProduct = {
  sku: string;
  nameEn: string;
  nameTh: string;
  type: "TIMED_ENTRY" | "ADDON" | "BUNDLE" | "HOUR_PASS";
  priceThb: number;
  grants: ProductGrants;
};

const CATALOG: SeedProduct[] = [
  { sku: "ENTRY_1H", nameEn: "1 Hour Entry", nameTh: "เข้าเล่น 1 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 199, grants: { hours: 1 } },
  { sku: "ENTRY_2H", nameEn: "2 Hours Entry", nameTh: "เข้าเล่น 2 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 300, grants: { hours: 2 } },
  { sku: "EXTRA_1H", nameEn: "Additional 1 Hour", nameTh: "เพิ่มเวลา 1 ชั่วโมง", type: "TIMED_ENTRY", priceThb: 100, grants: { hours: 1, extendOnly: true } },
  { sku: "CRAYON", nameEn: "Crayon Drawing Session", nameTh: "กิจกรรมระบายสีเทียน", type: "ADDON", priceThb: 59, grants: { crayonSessions: 1 } },
  { sku: "CLAY", nameEn: "Small Soft-Clay Statue Activity", nameTh: "กิจกรรมปั้นดินเบา", type: "ADDON", priceThb: 150, grants: { claySessions: 1 } },
  { sku: "PKG_1H_CRAYON", nameEn: "1 Hour + Crayon Session", nameTh: "1 ชั่วโมง + ระบายสีเทียน", type: "BUNDLE", priceThb: 239, grants: { hours: 1, crayonSessions: 1 } },
  { sku: "PKG_1H_2CLAY", nameEn: "1 Hour + 2 Small Statues", nameTh: "1 ชั่วโมง + ปั้นดินเบา 2 ชิ้น", type: "BUNDLE", priceThb: 349, grants: { hours: 1, claySessions: 2 } },
  { sku: "PKG_2H_CRAYON", nameEn: "2 Hours + Crayon Session", nameTh: "2 ชั่วโมง + ระบายสีเทียน", type: "BUNDLE", priceThb: 329, grants: { hours: 2, crayonSessions: 1 } },
  { sku: "PKG_2H_4CLAY", nameEn: "2 Hours + 4 Small Statues", nameTh: "2 ชั่วโมง + ปั้นดินเบา 4 ชิ้น", type: "BUNDLE", priceThb: 599, grants: { hours: 2, claySessions: 4 } },
  { sku: "PASS_30H", nameEn: "30-Hour Creative Play Pass", nameTh: "แพ็กเกจ 30 ชั่วโมง", type: "HOUR_PASS", priceThb: 3599, grants: { hours: 30, crayonSessions: 5, claySessions: 3, shareable: false } },
  { sku: "PASS_60H", nameEn: "60-Hour Creative Family Pass", nameTh: "แพ็กเกจครอบครัว 60 ชั่วโมง", type: "HOUR_PASS", priceThb: 5999, grants: { hours: 60, crayonSessions: 10, claySessions: 6, shareable: false } },
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

  console.log(`Seeding ${CATALOG.length} products…`);
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
