import { db } from "@/db";
import {
  products,
  orders,
  orderItems,
  payments,
  packageInstances,
  children,
  sessions,
  addonRedemptions,
  type ProductGrants,
} from "@/db/schema";
import { eq, inArray, like } from "drizzle-orm";
import { writeAudit } from "@/lib/audit";
import { bkkDateStamp } from "@/lib/time";

const HOUR_MS = 60 * 60 * 1000;

export type CartLine = { sku: string; qty: number };
export type PaymentMethod = "promptpay" | "bank" | "cash";

export class OrderError extends Error {}

// Adds 6 calendar months (HOUR_PASS validity, PRD §4/§7.5).
function plusSixMonths(from: Date): Date {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + 6);
  return d;
}

// Maps a product's grants JSON to the package_instance credit columns.
function instanceCreditsFor(
  type: string,
  grants: ProductGrants
): {
  hoursTotal: number;
  hoursRemaining: number;
  extraHoursRemaining: number;
  crayonCreditsRemaining: number;
  clayCreditsRemaining: number;
} {
  const hours = grants.hours ?? 0;
  const isExtra = grants.extendOnly === true;
  return {
    hoursTotal: isExtra ? 0 : hours,
    hoursRemaining: isExtra ? 0 : hours,
    extraHoursRemaining: isExtra ? hours : 0,
    crayonCreditsRemaining: grants.crayonSessions ?? 0,
    clayCreditsRemaining: grants.claySessions ?? 0,
  };
}

// Next daily receipt number SCCC-YYYYMMDD-#### (Bangkok day). Reads the day's
// existing numbers inside the transaction and takes max+1 in JS (a handful of
// rows per day). The unique constraint on receipt_no is the concurrency backstop
// — createPaidOrder retries the whole transaction on a collision.
async function nextReceiptNo(tx: typeof db, now: Date): Promise<string> {
  const stamp = bkkDateStamp(now);
  const prefix = `SCCC-${stamp}-`;
  const rows = await tx
    .select({ receiptNo: orders.receiptNo })
    .from(orders)
    .where(like(orders.receiptNo, `${prefix}%`));
  let maxSeq = 0;
  for (const r of rows) {
    const seq = parseInt((r.receiptNo ?? "").slice(prefix.length), 10);
    if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
  }
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}

export type CreateOrderResult = {
  orderId: number;
  receiptNo: string;
  extendRequested: boolean;
  extendApplied: boolean;
};

// Turns a validated cart into a paid order: order + items + one payment +
// N package_instances (qty expands to N independent instances), all with audit
// rows, in a single transaction. Caller must have already stored the proof photo.
export async function createPaidOrder(opts: {
  adminId: number;
  childId: number;
  lines: CartLine[];
  method: PaymentMethod;
  proofPhotoPath: string;
  // When set (from the session "+ Add 1 hour" shortcut), each EXTRA_1H bought
  // is consumed immediately against this running session, extending pickup by 1h.
  extendSessionId?: number | null;
}): Promise<CreateOrderResult> {
  const { adminId, childId, lines, method, proofPhotoPath, extendSessionId } = opts;
  if (lines.length === 0) throw new OrderError("Empty cart");
  if (!proofPhotoPath) throw new OrderError("Proof photo required");

  // Resolve the child + parent (for family-pass ownership).
  const [child] = await db.select().from(children).where(eq(children.id, childId)).limit(1);
  if (!child) throw new OrderError("Child not found");

  // Load the catalog rows for the requested SKUs.
  const skus = lines.map((l) => l.sku);
  const catalog = await db.select().from(products).where(inArray(products.sku, skus));
  const bySku = new Map(catalog.map((p) => [p.sku, p]));
  for (const l of lines) {
    if (!bySku.has(l.sku)) throw new OrderError(`Unknown SKU ${l.sku}`);
    if (!Number.isInteger(l.qty) || l.qty < 1) throw new OrderError(`Bad qty for ${l.sku}`);
  }

  const total = lines.reduce((sum, l) => sum + bySku.get(l.sku)!.priceThb * l.qty, 0);
  const extendRequested = extendSessionId != null;

  // Retry the whole transaction if two confirms race to the same receipt number
  // (unique violation, Postgres code 23505). Single-admin makes this rare, but a
  // jittered backoff between attempts de-collides concurrent double-taps.
  for (let attempt = 0; ; attempt++) {
    try {
      return await runOrderTx();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "23505" && attempt < 6) {
        await new Promise((r) => setTimeout(r, 15 + Math.floor(Math.random() * 40)));
        continue;
      }
      throw err;
    }
  }

  async function runOrderTx(): Promise<CreateOrderResult> {
    return db.transaction(async (tx) => {
    const now = new Date();
    const receiptNo = await nextReceiptNo(tx as unknown as typeof db, now);
    let extendApplied = false;

    const [order] = await tx
      .insert(orders)
      .values({
        createdByAdmin: adminId > 0 ? adminId : null,
        parentId: child.parentId ?? null,
        childId: child.id,
        status: "paid",
        totalThb: total,
        receiptNo,
      })
      .returning();

    for (const line of lines) {
      const product = bySku.get(line.sku)!;
      const [item] = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: product.id,
          qty: line.qty,
          unitPriceThb: product.priceThb,
          lineTotalThb: product.priceThb * line.qty,
        })
        .returning();

      const grants = (product.grants ?? {}) as ProductGrants;
      const credits = instanceCreditsFor(product.type, grants);
      const isFamilyPass = product.type === "HOUR_PASS" && grants.shareable === true;
      const expiresAt = product.type === "HOUR_PASS" ? plusSixMonths(now) : null;

      // qty N → N independent instances (PRD §5, §7.8).
      for (let i = 0; i < line.qty; i++) {
        const [inst] = await tx
          .insert(packageInstances)
          .values({
            orderItemId: item.id,
            productId: product.id,
            ownerChildId: isFamilyPass ? null : child.id,
            ownerParentId: isFamilyPass ? child.parentId ?? null : null,
            status: "available",
            expiresAt,
            ...credits,
          })
          .returning();

        await writeAudit(tx, {
          adminId,
          action: "package_instance_created",
          entity: "package_instance",
          entityId: inst.id,
          detail: { sku: product.sku, orderId: order.id, credits, expiresAt },
        });

        // EXTRA_1H bought from the session screen: consume immediately, extend
        // the running session's pickup time by 1h in the same transaction.
        if (grants.extendOnly && extendSessionId) {
          const [sess] = await tx.select().from(sessions).where(eq(sessions.id, extendSessionId)).limit(1);
          if (sess && sess.status === "running" && sess.childId === child.id) {
            extendApplied = true;
            const extended = new Date(sess.plannedEndAt.getTime() + HOUR_MS);
            await tx.update(sessions).set({ plannedEndAt: extended }).where(eq(sessions.id, sess.id));
            await tx
              .update(packageInstances)
              .set({ extraHoursRemaining: 0, status: "consumed" })
              .where(eq(packageInstances.id, inst.id));
            await tx.insert(addonRedemptions).values({
              packageInstanceId: inst.id,
              childId: child.id,
              type: "extra_hour",
              sessionId: sess.id,
              adminId: adminId > 0 ? adminId : null,
            });
            await writeAudit(tx, {
              adminId,
              action: "extra_hour_extended",
              entity: "session",
              entityId: sess.id,
              detail: { instanceId: inst.id, newPlannedEnd: extended.toISOString() },
            });
          }
        }
      }
    }

    const [payment] = await tx
      .insert(payments)
      .values({
        orderId: order.id,
        method,
        amountThb: total,
        proofPhotoPath,
        confirmedByAdmin: adminId > 0 ? adminId : null,
        confirmedAt: now,
      })
      .returning();

    await writeAudit(tx, {
      adminId,
      action: "payment_confirmed",
      entity: "order",
      entityId: order.id,
      detail: { receiptNo, method, total, paymentId: payment.id, lines },
    });

    return { orderId: order.id, receiptNo, extendRequested, extendApplied };
    });
  }
}
