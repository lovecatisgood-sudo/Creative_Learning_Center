import { NextResponse } from "next/server";
import { db } from "@/db";
import { parents, children } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toBkk } from "@/lib/time";

// Public (no auth) parent self-registration — PRD §6.1. Creates a full parent
// record (profile_complete = true) plus one or more children in a transaction.
// Duplicate phone is allowed (staff resolves later); the client shows the warning.
type ChildInput = { name: string; dob: string; gender: "male" | "female" };

// Mirrors the client-side checks in src/app/signup/page.tsx validate() —
// never trust the client.
const PHONE_RE = /^[0-9+\-\s]{6,20}$/;
function isPlausiblePhone(phone: string): boolean {
  if (!PHONE_RE.test(phone)) return false;
  return (phone.match(/\d/g) ?? []).length >= 6;
}
// Today's date (Asia/Bangkok) as YYYY-MM-DD, for future-DOB comparisons.
function bkkTodayISO(): string {
  const b = toBkk(new Date());
  const y = b.getUTCFullYear();
  const m = String(b.getUTCMonth() + 1).padStart(2, "0");
  const d = String(b.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const parentName = String(body.parentName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim() || null;
  const consent = body.consent === true;
  const kids: ChildInput[] = Array.isArray(body.children) ? body.children : [];

  // Server-side validation mirrors the required fields; never trust the client.
  if (!parentName || !phone || !consent || kids.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
  }
  if (!isPlausiblePhone(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 422 });
  }
  const today = bkkTodayISO();
  for (const k of kids) {
    if (!k?.name?.trim() || !k?.dob || (k.gender !== "male" && k.gender !== "female")) {
      return NextResponse.json({ error: "Invalid child data" }, { status: 422 });
    }
    if (k.dob > today) {
      return NextResponse.json({ error: "Date of birth can't be in the future" }, { status: 422 });
    }
  }

  // Detect (but never block) a duplicate phone — staff resolves later. The flag
  // is returned to the staff-facing success screen, not exposed as a public
  // lookup endpoint (avoids phone-number enumeration).
  const existing = await db
    .select({ id: parents.id })
    .from(parents)
    .where(eq(parents.phone, phone))
    .limit(1);
  const duplicatePhone = existing.length > 0;

  const result = await db.transaction(async (tx) => {
    const [parent] = await tx
      .insert(parents)
      .values({ name: parentName, phone, email, profileComplete: true })
      .returning();

    const insertedChildren = await tx
      .insert(children)
      .values(
        kids.map((k) => ({
          parentId: parent.id,
          name: k.name.trim(),
          dob: k.dob,
          gender: k.gender,
        }))
      )
      .returning();

    return { parent, children: insertedChildren };
  });

  return NextResponse.json({
    ok: true,
    parentName: result.parent.name,
    childNames: result.children.map((c) => c.name),
    duplicatePhone,
  });
}
