import bcrypt from "bcryptjs";
import { and, count, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { admins, auditLog } from "@/db/schema";
import { adminApiError } from "@/lib/admin-api";
import { isAdminRole } from "@/lib/admin-roles";
import { ForbiddenError, requireManager } from "@/lib/auth";

class TeamConflictError extends Error {}

function accountId(value: string): number {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function PATCH(request: Request) {
  try {
    const manager = await requireManager();
    const segments = new URL(request.url).pathname.split("/").filter(Boolean);
    const rawId = segments.at(-1) ?? "";
    const id = accountId(rawId);
    if (!id) return NextResponse.json({ error: "Invalid account" }, { status: 422 });

    const [target] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    if (!target) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const updates: {
      displayName?: string | null;
      role?: "manager" | "staff";
      active?: boolean;
      passwordHash?: string;
    } = {};

    if (body && Object.prototype.hasOwnProperty.call(body, "displayName")) {
      if (typeof body.displayName !== "string" || body.displayName.trim().length > 80) {
        return NextResponse.json({ error: "Invalid display name" }, { status: 422 });
      }
      updates.displayName = body.displayName.trim() || null;
    }
    if (body && Object.prototype.hasOwnProperty.call(body, "role")) {
      if (!isAdminRole(body.role)) return NextResponse.json({ error: "Invalid role" }, { status: 422 });
      updates.role = body.role;
    }
    if (body && Object.prototype.hasOwnProperty.call(body, "active")) {
      if (typeof body.active !== "boolean") return NextResponse.json({ error: "Invalid account status" }, { status: 422 });
      updates.active = body.active;
    }
    if (body && Object.prototype.hasOwnProperty.call(body, "password")) {
      if (typeof body.password !== "string" || body.password.length < 12) {
        return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 422 });
      }
      updates.passwordHash = await bcrypt.hash(body.password, 12);
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes supplied" }, { status: 422 });
    }

    const [account] = await db.transaction(async (tx) => {
      // Serialize manager-access changes so two simultaneous requests cannot
      // both observe a manager and remove the last two accounts at once.
      await tx.execute(sql`select pg_advisory_xact_lock(73194421)`);
      if (manager.id > 0) {
        const [actor] = await tx
          .select({ role: admins.role, active: admins.active })
          .from(admins)
          .where(eq(admins.id, manager.id))
          .limit(1);
        if (!actor?.active || actor.role !== "manager") throw new ForbiddenError();
      }

      const [currentTarget] = await tx.select().from(admins).where(eq(admins.id, id)).limit(1);
      if (!currentTarget) throw new TeamConflictError("Account no longer exists");
      const removesManagerAccess =
        currentTarget.role === "manager" && (updates.role === "staff" || updates.active === false);
      if (manager.id === id && removesManagerAccess) {
        throw new TeamConflictError("You cannot remove your own manager access");
      }
      if (removesManagerAccess) {
        const [{ value }] = await tx
          .select({ value: count() })
          .from(admins)
          .where(and(eq(admins.role, "manager"), eq(admins.active, true)));
        if (value <= 1) throw new TeamConflictError("At least one active manager is required");
      }

      const [updated] = await tx
        .update(admins)
        .set(updates)
        .where(eq(admins.id, id))
        .returning({ id: admins.id, email: admins.email, displayName: admins.displayName, role: admins.role, active: admins.active });
      await tx.insert(auditLog).values({
        adminId: manager.id > 0 ? manager.id : null,
        action: "admin_account_updated",
        entity: "admin",
        entityId: id,
        detail: {
          email: updated.email,
          role: updated.role,
          active: updated.active,
          passwordReset: Boolean(updates.passwordHash),
        },
      });
      return [updated];
    });

    return NextResponse.json({ account });
  } catch (error) {
    if (error instanceof TeamConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return adminApiError(error, "Unable to update team account");
  }
}
