import "./env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { products } from "./schema";
import { sql } from "drizzle-orm";
import { CURRENT_PRODUCT_CATALOG } from "@/lib/product-catalog";

// Current public package set. Products are config, not code — this script is
// idempotent (upsert on SKU) and deactivates older retired SKUs before seeding.
const CATALOG = CURRENT_PRODUCT_CATALOG;

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
