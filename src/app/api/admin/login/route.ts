import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";

// Single shared admin credential. Env holds the canonical email + bcrypt hash;
// the admins table row (created by scripts/create-admin.ts) provides the id used
// for audit logging. We accept either source so login works before/after seeding.
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const envEmail = process.env.ADMIN_EMAIL;
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  // Prefer the DB admin row (has an id); fall back to env-only for first boot.
  const [row] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email.toLowerCase().trim()))
    .limit(1);

  let ok = false;
  let adminId: number | undefined;
  if (row) {
    ok = await bcrypt.compare(password, row.passwordHash);
    adminId = row.id;
  } else if (envEmail && envHash && email.toLowerCase().trim() === envEmail.toLowerCase().trim()) {
    ok = await bcrypt.compare(password, envHash);
  }

  if (!ok) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const session = await getSession();
  session.adminId = adminId ?? -1; // -1 marks an env-only admin (pre-seed)
  session.email = email.toLowerCase().trim();
  await session.save();

  return NextResponse.json({ ok: true });
}
