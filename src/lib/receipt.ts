import { db } from "@/db";
import { orders, orderItems, payments, products, children, parents, packageInstances } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ReceiptData = {
  orderId: number;
  receiptNo: string | null;
  createdAt: string;
  totalThb: number;
  childName: string | null;
  childId: number | null;
  parentName: string | null;
  method: "promptpay" | "bank" | "cash" | null;
  proofKey: string | null;
  items: { nameEn: string; nameTh: string; qty: number; unitPriceThb: number; lineTotalThb: number }[];
  hasStartable: boolean; // order produced any available startable instance (timed/bundle/pass)
};

export async function getReceipt(orderId: number): Promise<ReceiptData | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;

  const [child] = order.childId
    ? await db.select().from(children).where(eq(children.id, order.childId)).limit(1)
    : [null];
  const [parent] = order.parentId
    ? await db.select().from(parents).where(eq(parents.id, order.parentId)).limit(1)
    : [null];

  const items = await db
    .select({
      nameEn: products.nameEn,
      nameTh: products.nameTh,
      qty: orderItems.qty,
      unitPriceThb: orderItems.unitPriceThb,
      lineTotalThb: orderItems.lineTotalThb,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);

  // Startable = an available instance holding hours (timed/bundle/pass). Pure
  // credit instances (à la carte crayon/clay/extra) are not "started".
  const instances = await db
    .select({ hoursTotal: packageInstances.hoursTotal, status: packageInstances.status })
    .from(packageInstances)
    .innerJoin(orderItems, eq(packageInstances.orderItemId, orderItems.id))
    .where(eq(orderItems.orderId, orderId));
  const hasStartable = instances.some((i) => i.status === "available" && i.hoursTotal > 0);

  return {
    orderId: order.id,
    receiptNo: order.receiptNo,
    createdAt: order.createdAt.toISOString(),
    totalThb: order.totalThb,
    childName: child?.name ?? null,
    childId: order.childId,
    parentName: parent?.name?.trim() || null,
    method: payment?.method ?? null,
    proofKey: payment?.proofPhotoPath ?? null,
    items,
    hasStartable,
  };
}
