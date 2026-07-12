import { db } from "@/db";
import {
  sessions,
  packageInstances,
  products,
  children,
  addonRedemptions,
  type ProductGrants,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeAudit, type DbOrTx } from "@/lib/audit";
import { effectiveStatus } from "@/lib/product";

const HOUR_MS = 60 * 60 * 1000;

export class SessionError extends Error {}

// Instance status after a mutation: consumed once nothing is left, otherwise
// available (a pass returns to available between visits while hours/credits last).
function statusAfter(inst: {
  hoursRemaining: number;
  crayonCreditsRemaining: number;
  clayCreditsRemaining: number;
  extraHoursRemaining: number;
}): "available" | "consumed" {
  const anyLeft =
    inst.hoursRemaining > 0 ||
    inst.crayonCreditsRemaining > 0 ||
    inst.clayCreditsRemaining > 0 ||
    inst.extraHoursRemaining > 0;
  return anyLeft ? "available" : "consumed";
}

// ── Start a session (A7 / PRD §6.5) ──────────────────────────────────────────
export async function startSession(opts: {
  adminId: number;
  packageInstanceId: number;
  childId: number;
  hours?: number; // required for HOUR_PASS (1..min(remaining,12))
}): Promise<{ sessionId: number; plannedEndAt: string; hoursBooked: number; hoursRemaining: number }> {
  const { adminId, packageInstanceId, childId } = opts;

  return db.transaction(async (tx) => {
    const [inst] = await tx.select().from(packageInstances).where(eq(packageInstances.id, packageInstanceId)).limit(1);
    if (!inst) throw new SessionError("Package not found");
    if (effectiveStatus(inst.status, inst.expiresAt) === "expired") throw new SessionError("Package expired");
    if (inst.status !== "available") throw new SessionError("Package not available to start");

    const [product] = await tx.select().from(products).where(eq(products.id, inst.productId)).limit(1);
    if (!product) throw new SessionError("Product missing");
    const grants = (product.grants ?? {}) as ProductGrants;
    if (grants.extendOnly || inst.hoursTotal <= 0) throw new SessionError("This item cannot start a session");

    // Family (shareable, parent-owned) pass may be started for any sibling; a
    // child-bound instance only for its owner child.
    const [child] = await tx.select().from(children).where(eq(children.id, childId)).limit(1);
    if (!child) throw new SessionError("Child not found");
    if (inst.ownerParentId) {
      if (child.parentId !== inst.ownerParentId) throw new SessionError("Child not on this family pass");
    } else if (inst.ownerChildId && inst.ownerChildId !== childId) {
      throw new SessionError("Package bound to another child");
    }

    const isPass = product.type === "HOUR_PASS";
    let hoursBooked: number;
    let newHoursRemaining = inst.hoursRemaining;
    if (isPass) {
      const requested = Math.floor(opts.hours ?? 0);
      const cap = Math.min(inst.hoursRemaining, 12);
      if (requested < 1 || requested > cap) throw new SessionError(`Hours must be 1..${cap}`);
      hoursBooked = requested;
      newHoursRemaining = inst.hoursRemaining - requested; // deduct in-transaction
    } else {
      hoursBooked = inst.hoursTotal; // timed/bundle consumed whole
    }

    const now = new Date();
    const plannedEnd = new Date(now.getTime() + hoursBooked * HOUR_MS);

    const [session] = await tx
      .insert(sessions)
      .values({
        packageInstanceId,
        childId,
        hoursBooked,
        startedAt: now,
        plannedEndAt: plannedEnd,
        status: "running",
      })
      .returning();

    await tx
      .update(packageInstances)
      .set({ status: "active", hoursRemaining: newHoursRemaining })
      .where(eq(packageInstances.id, packageInstanceId));

    await writeAudit(tx, {
      adminId,
      action: "session_started",
      entity: "session",
      entityId: session.id,
      detail: {
        packageInstanceId,
        childId,
        hoursBooked,
        isPass,
        hoursRemainingBefore: inst.hoursRemaining,
        hoursRemainingAfter: newHoursRemaining,
      },
    });

    return {
      sessionId: session.id,
      plannedEndAt: plannedEnd.toISOString(),
      hoursBooked,
      hoursRemaining: newHoursRemaining,
    };
  });
}

// ── End a session, with hour refund for HOUR_PASS only (A9 / PRD §6.6) ────────
// Refund = booked − whole elapsed hours (a partial hour counts as used), never
// negative. Matches the owner examples: booked 4h, used 3h02m → refund 1.
export function suggestedRefund(hoursBooked: number, startedAt: Date, now: Date): number {
  const wholeElapsed = Math.floor((now.getTime() - startedAt.getTime()) / HOUR_MS);
  return Math.max(0, hoursBooked - wholeElapsed);
}

export async function endSession(opts: {
  adminId: number;
  sessionId: number;
  refundHours?: number; // honored only for HOUR_PASS; capped at the suggestion
}): Promise<{ isPass: boolean; refunded: number; hoursRemaining: number }> {
  const { adminId, sessionId } = opts;

  return db.transaction(async (tx) => {
    const [session] = await tx.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) throw new SessionError("Session not found");
    if (session.status !== "running") throw new SessionError("Session already ended");

    const [inst] = await tx.select().from(packageInstances).where(eq(packageInstances.id, session.packageInstanceId)).limit(1);
    const [product] = await tx.select().from(products).where(eq(products.id, inst.productId)).limit(1);
    const isPass = product?.type === "HOUR_PASS";

    const now = new Date();
    let refunded = 0;
    let newHoursRemaining = inst.hoursRemaining;

    if (isPass) {
      // Refund path exists ONLY for HOUR_PASS (PRD §7.3), asserted server-side.
      const suggestion = suggestedRefund(session.hoursBooked, session.startedAt, now);
      const requested = opts.refundHours == null ? suggestion : Math.floor(opts.refundHours);
      refunded = Math.max(0, Math.min(requested, suggestion));
      newHoursRemaining = inst.hoursRemaining + refunded;
    }

    await tx
      .update(sessions)
      .set({ status: "completed", endedAt: now, hoursRefunded: refunded })
      .where(eq(sessions.id, sessionId));

    const instAfter = { ...inst, hoursRemaining: newHoursRemaining };
    await tx
      .update(packageInstances)
      .set({ hoursRemaining: newHoursRemaining, status: isPass ? statusAfter(instAfter) : "consumed" })
      .where(eq(packageInstances.id, inst.id));

    await writeAudit(tx, {
      adminId,
      action: "session_ended",
      entity: "session",
      entityId: sessionId,
      detail: {
        isPass,
        hoursBooked: session.hoursBooked,
        refunded,
        hoursRemainingBefore: inst.hoursRemaining,
        hoursRemainingAfter: newHoursRemaining,
      },
    });

    return { isPass, refunded, hoursRemaining: newHoursRemaining };
  });
}

// ── Consume a credit: crayon / clay / extra_hour (A10 / PRD §6.7) ─────────────
export async function redeemCredit(opts: {
  adminId: number;
  packageInstanceId: number;
  childId: number;
  type: "crayon" | "clay" | "extra_hour";
  sessionId?: number | null;
}): Promise<{ status: string; extendedSessionId?: number; newPlannedEnd?: string }> {
  const { adminId, packageInstanceId, childId, type } = opts;

  return db.transaction(async (tx) => {
    const [inst] = await tx.select().from(packageInstances).where(eq(packageInstances.id, packageInstanceId)).limit(1);
    if (!inst) throw new SessionError("Package not found");
    if (effectiveStatus(inst.status, inst.expiresAt) === "expired") throw new SessionError("Package expired");

    let extendedSessionId: number | undefined;
    let newPlannedEnd: string | undefined;
    const patch: Partial<typeof packageInstances.$inferInsert> = {};

    if (type === "crayon") {
      if (inst.crayonCreditsRemaining < 1) throw new SessionError("No crayon credits");
      patch.crayonCreditsRemaining = inst.crayonCreditsRemaining - 1;
    } else if (type === "clay") {
      if (inst.clayCreditsRemaining < 1) throw new SessionError("No clay credits");
      patch.clayCreditsRemaining = inst.clayCreditsRemaining - 1;
    } else {
      // extra_hour: hard-blocked without a running session (PRD §6.7 / criterion).
      if (inst.extraHoursRemaining < 1) throw new SessionError("No extra-hour credits");
      if (!opts.sessionId) throw new SessionError("A running session is required to consume +1 hour");
      const [session] = await tx.select().from(sessions).where(eq(sessions.id, opts.sessionId)).limit(1);
      if (!session || session.status !== "running") throw new SessionError("No running session");
      const extended = new Date(session.plannedEndAt.getTime() + HOUR_MS);
      await tx.update(sessions).set({ plannedEndAt: extended }).where(eq(sessions.id, session.id));
      patch.extraHoursRemaining = inst.extraHoursRemaining - 1;
      extendedSessionId = session.id;
      newPlannedEnd = extended.toISOString();
    }

    const merged = { ...inst, ...patch };
    // À la carte addon/extra instances (no hours) flip to consumed at 0 credits.
    const nextStatus = inst.hoursTotal === 0 ? statusAfter(merged) : inst.status;
    await tx
      .update(packageInstances)
      .set({ ...patch, status: nextStatus })
      .where(eq(packageInstances.id, packageInstanceId));

    await tx.insert(addonRedemptions).values({
      packageInstanceId,
      childId,
      type,
      sessionId: opts.sessionId ?? null,
      adminId: adminId > 0 ? adminId : null,
    });

    await writeAudit(tx as DbOrTx, {
      adminId,
      action: "credit_redeemed",
      entity: "package_instance",
      entityId: packageInstanceId,
      detail: { type, childId, sessionId: opts.sessionId ?? null, extendedSessionId, newPlannedEnd },
    });

    return { status: nextStatus, extendedSessionId, newPlannedEnd };
  });
}
