import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { ensureAdminRbacSchema } from "@/db/ensure-admin-rbac";
import type { AdminRole } from "@/lib/admin-roles";
import { sessionOptions, type AdminSession } from "./session";

// Server-side session accessor for App Router route handlers & server components.
export async function getSession() {
  return getIronSession<AdminSession>(await cookies(), sessionOptions);
}

export type CurrentAdmin = {
  id: number;
  email: string;
  displayName: string | null;
  role: AdminRole;
};

// Resolve the role from the database on every protected request. This makes a
// deactivation or role change effective immediately instead of trusting a
// potentially stale 12-hour browser session.
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await getSession();
  if (!session.adminId) return null;

  if (session.adminId === -1) {
    return session.email
      ? { id: -1, email: session.email, displayName: null, role: "manager" }
      : null;
  }

  await ensureAdminRbacSchema();
  const [admin] = await db
    .select({
      id: admins.id,
      email: admins.email,
      displayName: admins.displayName,
      role: admins.role,
      active: admins.active,
    })
    .from(admins)
    .where(eq(admins.id, session.adminId))
    .limit(1);

  if (!admin?.active) return null;
  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
  };
}

export async function getAdminId(): Promise<number | null> {
  return (await getCurrentAdmin())?.id ?? null;
}

// Guard for /api/admin/* route handlers. Returns the admin id or throws a 401.
export async function requireAdminId(): Promise<number> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin.id;
}

export async function requireManager(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new UnauthorizedError();
  if (admin.role !== "manager") throw new ForbiddenError();
  return admin;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}
