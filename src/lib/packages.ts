import { db } from "@/db";
import { packageInstances, products, orders, sessions } from "@/db/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import { effectiveStatus, type ChildPackage, type HistoryItem } from "@/lib/product";

export type { ChildPackage, HistoryItem, InstanceStatus } from "@/lib/product";
export { effectiveStatus, productName } from "@/lib/product";

// Instances usable by this child: every package/credit is bound to the one
// child it was sold to (owner decision 2026-07-14; no parent-level sharing).
export async function getChildPackages(childId: number): Promise<ChildPackage[]> {
  const rows = await db
    .select({
      id: packageInstances.id,
      productSku: products.sku,
      nameEn: products.nameEn,
      nameTh: products.nameTh,
      type: products.type,
      grants: products.grants,
      status: packageInstances.status,
      hoursTotal: packageInstances.hoursTotal,
      hoursRemaining: packageInstances.hoursRemaining,
      crayonCreditsRemaining: packageInstances.crayonCreditsRemaining,
      clayCreditsRemaining: packageInstances.clayCreditsRemaining,
      extraHoursRemaining: packageInstances.extraHoursRemaining,
      expiresAt: packageInstances.expiresAt,
    })
    .from(packageInstances)
    .innerJoin(products, eq(packageInstances.productId, products.id))
    .where(eq(packageInstances.ownerChildId, childId))
    .orderBy(desc(packageInstances.createdAt));

  const now = new Date();
  return rows.map((r) => ({
    id: r.id,
    productSku: r.productSku,
    nameEn: r.nameEn,
    nameTh: r.nameTh,
    type: r.type,
    status: effectiveStatus(r.status, r.expiresAt, now),
    hoursTotal: r.hoursTotal,
    hoursRemaining: r.hoursRemaining,
    crayonCreditsRemaining: r.crayonCreditsRemaining,
    clayCreditsRemaining: r.clayCreditsRemaining,
    extraHoursRemaining: r.extraHoursRemaining,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    isFamily: false, // family sharing removed 2026-07-14; every instance is child-bound
  }));
}

// Reverse-chron receipts (paid orders) + completed sessions for this child.
export async function getChildHistory(childId: number): Promise<HistoryItem[]> {
  const receiptRows = await db
    .select({
      id: orders.id,
      receiptNo: orders.receiptNo,
      totalThb: orders.totalThb,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.childId, childId), eq(orders.status, "paid")))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  const sessionRows = await db
    .select({ id: sessions.id, endedAt: sessions.endedAt })
    .from(sessions)
    .where(and(eq(sessions.childId, childId), eq(sessions.status, "completed"), isNotNull(sessions.endedAt)))
    .orderBy(desc(sessions.endedAt))
    .limit(50);

  const items: HistoryItem[] = [
    ...receiptRows.map((r) => ({
      kind: "receipt" as const,
      id: r.id,
      receiptNo: r.receiptNo,
      totalThb: r.totalThb,
      at: r.createdAt.toISOString(),
    })),
    ...sessionRows.map((s) => ({
      kind: "session" as const,
      id: s.id,
      at: (s.endedAt as Date).toISOString(),
    })),
  ];
  items.sort((a, b) => b.at.localeCompare(a.at));
  return items;
}
