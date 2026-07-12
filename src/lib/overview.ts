import { db } from "@/db";
import { payments, orders, orderItems, products, children, sessions, addonRedemptions } from "@/db/schema";
import { and, gte, lt, eq, desc, sql, inArray } from "drizzle-orm";
import { BKK_OFFSET_MS, toBkk } from "@/lib/time";

export type Unit = "day" | "week" | "month";

// A UTC instant for Bangkok wall-clock components (Date.UTC handles overflow/
// underflow of month & day, so offsets just add to the field).
function bkkWallToUtc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d) - BKK_OFFSET_MS);
}

export type Period = { startUtc: Date; endUtc: Date; unit: Unit; offset: number };

// Period boundaries in Asia/Bangkok. offset 0 = current; negative = past. Weeks
// start Monday. Forward is capped by the caller (offset never > 0).
export function computePeriod(unit: Unit, offset: number, now = new Date()): Period {
  const b = toBkk(now);
  const y = b.getUTCFullYear();
  const mo = b.getUTCMonth();
  const d = b.getUTCDate();
  const dow = b.getUTCDay(); // 0=Sun..6=Sat

  let startUtc: Date;
  let endUtc: Date;
  if (unit === "day") {
    startUtc = bkkWallToUtc(y, mo, d + offset);
    endUtc = bkkWallToUtc(y, mo, d + offset + 1);
  } else if (unit === "week") {
    const daysFromMon = (dow + 6) % 7;
    startUtc = bkkWallToUtc(y, mo, d - daysFromMon + offset * 7);
    endUtc = bkkWallToUtc(y, mo, d - daysFromMon + offset * 7 + 7);
  } else {
    startUtc = bkkWallToUtc(y, mo + offset, 1);
    endUtc = bkkWallToUtc(y, mo + offset + 1, 1);
  }
  return { startUtc, endUtc, unit, offset };
}

export type OverviewOrder = {
  orderId: number;
  receiptNo: string | null;
  at: string;
  childName: string | null;
  method: "promptpay" | "bank" | "cash" | null;
  amountThb: number;
  items: { nameEn: string; nameTh: string; qty: number }[];
};

export type OverviewData = {
  startUtc: string;
  endUtc: string;
  unit: Unit;
  offset: number;
  totals: { cash: number; promptpay: number; bank: number; grand: number };
  counts: { orders: number; sessions: number; credits: number };
  orders: OverviewOrder[];
};

// Everything the Overview screen shows for the selected period. Driven by a
// single range on payments.confirmed_at (PRD §6.9); no pre-aggregation tables.
export async function getOverview(unit: Unit, offset: number): Promise<OverviewData> {
  const cappedOffset = Math.min(offset, 0);
  const { startUtc, endUtc } = computePeriod(unit, cappedOffset);
  const inRange = (col: typeof payments.confirmedAt) => and(gte(col, startUtc), lt(col, endUtc));

  // Per-method totals + grand total from confirmed payments in range.
  const totalRows = await db
    .select({
      method: payments.method,
      sum: sql<number>`coalesce(sum(${payments.amountThb}),0)::int`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(inRange(payments.confirmedAt))
    .groupBy(payments.method);

  const totals = { cash: 0, promptpay: 0, bank: 0, grand: 0 };
  let orderCount = 0;
  for (const r of totalRows) {
    totals[r.method] = r.sum;
    totals.grand += r.sum;
    orderCount += r.cnt;
  }

  // Sessions started + credits consumed in the same range.
  const [{ sessCount }] = await db
    .select({ sessCount: sql<number>`count(*)::int` })
    .from(sessions)
    .where(and(gte(sessions.startedAt, startUtc), lt(sessions.startedAt, endUtc)));
  const [{ credCount }] = await db
    .select({ credCount: sql<number>`count(*)::int` })
    .from(addonRedemptions)
    .where(and(gte(addonRedemptions.redeemedAt, startUtc), lt(addonRedemptions.redeemedAt, endUtc)));

  // Order list for the period (via each order's confirmed payment).
  const orderRows = await db
    .select({
      orderId: orders.id,
      receiptNo: orders.receiptNo,
      at: payments.confirmedAt,
      method: payments.method,
      amountThb: payments.amountThb,
      childName: children.name,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .leftJoin(children, eq(orders.childId, children.id))
    .where(inRange(payments.confirmedAt))
    .orderBy(desc(payments.confirmedAt))
    .limit(200);

  // Item summaries per order (small volumes; one grouped query).
  const orderIds = orderRows.map((o) => o.orderId);
  const itemsByOrder = new Map<number, { nameEn: string; nameTh: string; qty: number }[]>();
  if (orderIds.length > 0) {
    const itemRows = await db
      .select({
        orderId: orderItems.orderId,
        nameEn: products.nameEn,
        nameTh: products.nameTh,
        qty: orderItems.qty,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orderItems.orderId, orderIds));
    for (const it of itemRows) {
      const arr = itemsByOrder.get(it.orderId) ?? [];
      arr.push({ nameEn: it.nameEn, nameTh: it.nameTh, qty: it.qty });
      itemsByOrder.set(it.orderId, arr);
    }
  }

  return {
    startUtc: startUtc.toISOString(),
    endUtc: endUtc.toISOString(),
    unit,
    offset: cappedOffset,
    totals,
    counts: { orders: orderCount, sessions: sessCount, credits: credCount },
    orders: orderRows.map((o) => ({
      orderId: o.orderId,
      receiptNo: o.receiptNo,
      at: (o.at as Date).toISOString(),
      childName: o.childName,
      method: o.method,
      amountThb: o.amountThb,
      items: itemsByOrder.get(o.orderId) ?? [],
    })),
  };
}
