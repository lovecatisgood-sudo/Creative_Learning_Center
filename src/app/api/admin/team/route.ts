import bcrypt from "bcryptjs";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { admins, auditLog } from "@/db/schema";
import { adminApiError } from "@/lib/admin-api";
import { isAdminRole } from "@/lib/admin-roles";
import { requireManager } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    await requireManager();
    const team = await db
      .select({ id: admins.id, email: admins.email, displayName: admins.displayName, role: admins.role, active: admins.active })
      .from(admins)
      .orderBy(asc(admins.role), asc(admins.email));
    return NextResponse.json({ team });
  } catch (error) {
    return adminApiError(error, "Unable to load team accounts");
  }
}

export async function POST(request: Request) {
  try {
    const manager = await requireManager();
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
    const role = body?.role ?? "staff";

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 422 });
    }
    if (password.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 422 });
    }
    if (displayName.length > 80 || !isAdminRole(role)) {
      return NextResponse.json({ error: "Invalid account details" }, { status: 422 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [account] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(admins)
        .values({ email, passwordHash, displayName: displayName || null, role, active: true })
        .returning({ id: admins.id, email: admins.email, displayName: admins.displayName, role: admins.role, active: admins.active });
      await tx.insert(auditLog).values({
        adminId: manager.id > 0 ? manager.id : null,
        action: "admin_account_created",
        entity: "admin",
        entityId: created.id,
        detail: { email: created.email, role: created.role },
      });
      return [created];
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return adminApiError(error, "Unable to create team account");
  }
}
