import { db } from "@/db";
import { sessions, packageInstances, products, children } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getChildPackages } from "@/lib/packages";

export type ActiveSession = {
  id: number;
  childId: number;
  childName: string;
  packageInstanceId: number;
  productSku: string;
  nameEn: string;
  nameTh: string;
  hoursBooked: number;
  startedAt: string;
  plannedEndAt: string;
  isHourPass: boolean;
  hoursRemaining: number;
};

function mapRow(r: {
  id: number;
  childId: number;
  childName: string;
  packageInstanceId: number;
  productSku: string;
  nameEn: string;
  nameTh: string;
  type: string;
  hoursBooked: number;
  startedAt: Date;
  plannedEndAt: Date;
  hoursRemaining: number;
}): ActiveSession {
  return {
    id: r.id,
    childId: r.childId,
    childName: r.childName,
    packageInstanceId: r.packageInstanceId,
    productSku: r.productSku,
    nameEn: r.nameEn,
    nameTh: r.nameTh,
    hoursBooked: r.hoursBooked,
    startedAt: r.startedAt.toISOString(),
    plannedEndAt: r.plannedEndAt.toISOString(),
    isHourPass: r.type === "HOUR_PASS",
    hoursRemaining: r.hoursRemaining,
  };
}

const baseSelect = {
  id: sessions.id,
  childId: sessions.childId,
  childName: children.name,
  packageInstanceId: sessions.packageInstanceId,
  productSku: products.sku,
  nameEn: products.nameEn,
  nameTh: products.nameTh,
  type: products.type,
  hoursBooked: sessions.hoursBooked,
  startedAt: sessions.startedAt,
  plannedEndAt: sessions.plannedEndAt,
  hoursRemaining: packageInstances.hoursRemaining,
};

export async function getActiveSessionForChild(childId: number): Promise<ActiveSession | null> {
  const [row] = await db
    .select(baseSelect)
    .from(sessions)
    .innerJoin(packageInstances, eq(sessions.packageInstanceId, packageInstances.id))
    .innerJoin(products, eq(packageInstances.productId, products.id))
    .innerJoin(children, eq(sessions.childId, children.id))
    .where(and(eq(sessions.childId, childId), eq(sessions.status, "running")))
    .limit(1);
  return row ? mapRow(row) : null;
}

// All running sessions for the dashboard (A1), soonest pickup first.
export async function getRunningSessions(): Promise<ActiveSession[]> {
  const rows = await db
    .select(baseSelect)
    .from(sessions)
    .innerJoin(packageInstances, eq(sessions.packageInstanceId, packageInstances.id))
    .innerJoin(products, eq(packageInstances.productId, products.id))
    .innerJoin(children, eq(sessions.childId, children.id))
    .where(eq(sessions.status, "running"))
    .orderBy(asc(sessions.plannedEndAt));
  return rows.map(mapRow);
}

export type Consumable = {
  instanceId: number;
  type: "crayon" | "clay" | "extra_hour";
  remaining: number;
  nameEn: string;
  nameTh: string;
};

export type SessionDetail = {
  session: ActiveSession;
  consumables: Consumable[];
};

// Session detail + the "Consumables during this session" strip (A9): every
// credit the child holds — own add-ons, bundle/pass credits, family-pass credits.
export async function getSessionDetail(sessionId: number): Promise<SessionDetail | null> {
  const [row] = await db
    .select(baseSelect)
    .from(sessions)
    .innerJoin(packageInstances, eq(sessions.packageInstanceId, packageInstances.id))
    .innerJoin(products, eq(packageInstances.productId, products.id))
    .innerJoin(children, eq(sessions.childId, children.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!row) return null;

  const session = mapRow(row);
  const packages = await getChildPackages(session.childId);

  const consumables: Consumable[] = [];
  for (const p of packages) {
    if (p.status === "expired" || p.status === "consumed") continue;
    if (p.crayonCreditsRemaining > 0)
      consumables.push({ instanceId: p.id, type: "crayon", remaining: p.crayonCreditsRemaining, nameEn: p.nameEn, nameTh: p.nameTh });
    if (p.clayCreditsRemaining > 0)
      consumables.push({ instanceId: p.id, type: "clay", remaining: p.clayCreditsRemaining, nameEn: p.nameEn, nameTh: p.nameTh });
    if (p.extraHoursRemaining > 0)
      consumables.push({ instanceId: p.id, type: "extra_hour", remaining: p.extraHoursRemaining, nameEn: p.nameEn, nameTh: p.nameTh });
  }
  return { session, consumables };
}
