import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, orderItems, orders, payments, products } from "@/db/schema";
import type { CurrentMember } from "@/lib/member-auth";

export type MemberReceipt = {
  orderId: number;
  receiptNo: string | null;
  createdAt: string;
  totalThb: number;
  childName: string | null;
  method: "promptpay" | "bank" | "cash" | null;
  items: Array<{ nameEn: string; nameTh: string; qty: number; unitPriceThb: number; lineTotalThb: number }>;
};

export async function getMemberReceipt(member: CurrentMember, orderId: number): Promise<MemberReceipt | null> {
  const [row] = await db
    .select({
      orderId: orders.id,
      receiptNo: orders.receiptNo,
      createdAt: orders.createdAt,
      totalThb: orders.totalThb,
      childName: children.name,
      method: payments.method,
    })
    .from(orders)
    .leftJoin(children, eq(orders.childId, children.id))
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(and(eq(orders.id, orderId), eq(orders.parentId, member.parentId), eq(orders.status, "paid")))
    .limit(1);
  if (!row) return null;
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
  return { ...row, createdAt: row.createdAt.toISOString(), items };
}
