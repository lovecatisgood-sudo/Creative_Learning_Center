import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { CatalogProduct } from "@/lib/product";

// Active catalog for the Sell grid, ordered by price within their natural groups.
export async function getCatalog(): Promise<CatalogProduct[]> {
  const rows = await db
    .select({
      sku: products.sku,
      nameEn: products.nameEn,
      nameTh: products.nameTh,
      type: products.type,
      priceThb: products.priceThb,
    })
    .from(products)
    .where(eq(products.active, true));
  return rows;
}

// Bank/PromptPay display info from env (server-only values surfaced to checkout).
export function getPaymentInfo() {
  return {
    promptpayConfigured: Boolean(process.env.PROMPTPAY_ID),
    bankConfigured: Boolean(process.env.BANK_ACCOUNT_NUMBER || process.env.BANK_NAME),
    bankName: process.env.BANK_NAME || "",
    bankAccountName: process.env.BANK_ACCOUNT_NAME || "",
    bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
  };
}
export type PaymentInfo = ReturnType<typeof getPaymentInfo>;
