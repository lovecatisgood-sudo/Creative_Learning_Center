import { db } from "@/db";
import { parents, children, orders, sessions } from "@/db/schema";
import { eq, and, inArray, asc, desc } from "drizzle-orm";
import { ageFromDob } from "@/lib/children";

export type ParentChild = {
  id: number;
  name: string;
  ageYears: number | null;
  hasRunningSession: boolean;
};

export type ParentReceipt = {
  orderId: number;
  receiptNo: string | null;
  totalThb: number;
  createdAt: string;
  childId: number | null;
  childName: string | null;
};

export type ParentDetail = {
  parent: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    profileComplete: boolean;
  };
  children: ParentChild[];
  receipts: ParentReceipt[];
};

// A parent's full picture for the directory drill-down: header fields, every
// child (age + running dot, reusing ageFromDob from lib/children), and the
// paid-order history across all of the parent's children (reusing the
// receipt-row shape from lib/packages' getChildHistory, extended with which
// child each receipt belongs to since a parent can have several).
export async function getParentDetail(id: number): Promise<ParentDetail | null> {
  const [parentRow] = await db.select().from(parents).where(eq(parents.id, id)).limit(1);
  if (!parentRow) return null;

  const childRows = await db
    .select({ id: children.id, name: children.name, dob: children.dob })
    .from(children)
    .where(eq(children.parentId, id))
    .orderBy(asc(children.name));

  const childIds = childRows.map((c) => c.id);

  // Batched membership check instead of a per-row correlated EXISTS subquery:
  // a `sql` template referencing ${children.id} inside a nested subquery
  // compiles to an unqualified "id" column, which collides with sessions'
  // own "id" PK and silently breaks the correlation (see src/lib/directory.ts,
  // fixed alongside this). IN-list + Set is unambiguous and just as cheap.
  const runningChildIds = new Set<number>(
    childIds.length
      ? (
          await db
            .select({ childId: sessions.childId })
            .from(sessions)
            .where(and(inArray(sessions.childId, childIds), eq(sessions.status, "running")))
        ).map((r) => r.childId)
      : []
  );

  const receiptRows = childIds.length
    ? await db
        .select({
          orderId: orders.id,
          receiptNo: orders.receiptNo,
          totalThb: orders.totalThb,
          createdAt: orders.createdAt,
          childId: orders.childId,
          childName: children.name,
        })
        .from(orders)
        .leftJoin(children, eq(orders.childId, children.id))
        .where(and(inArray(orders.childId, childIds), eq(orders.status, "paid")))
        .orderBy(desc(orders.createdAt))
        .limit(100)
    : [];

  return {
    parent: {
      id: parentRow.id,
      name: parentRow.name,
      phone: parentRow.phone,
      email: parentRow.email,
      // A stub parent (name blank) is treated as incomplete regardless, same
      // rule as getChildCore in lib/children.ts.
      profileComplete: Boolean(parentRow.profileComplete) && Boolean(parentRow.name?.trim()),
    },
    children: childRows.map((c) => ({
      id: c.id,
      name: c.name,
      ageYears: ageFromDob(c.dob),
      hasRunningSession: runningChildIds.has(c.id),
    })),
    receipts: receiptRows.map((r) => ({
      orderId: r.orderId,
      receiptNo: r.receiptNo,
      totalThb: r.totalThb,
      createdAt: r.createdAt.toISOString(),
      childId: r.childId,
      childName: r.childName,
    })),
  };
}
