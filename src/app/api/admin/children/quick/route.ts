import { NextResponse } from "next/server";
import { db } from "@/db";
import { parents, children } from "@/db/schema";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// A2b — quick add child (two fields). Creates a stub parent keyed by phone,
// flagged profile_complete = false, and links the child to it so the child
// carries its contact phone and can be sold to immediately. Staff completes
// the parent details (or links to an existing parent by phone) later.
export async function POST(req: Request) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const childName = String(body?.childName ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  if (!childName || !phone) {
    return NextResponse.json({ error: "Child name and phone are required" }, { status: 422 });
  }

  const childId = await db.transaction(async (tx) => {
    const [stubParent] = await tx
      .insert(parents)
      .values({ name: "", phone, email: null, profileComplete: false })
      .returning();
    const [child] = await tx
      .insert(children)
      .values({ parentId: stubParent.id, name: childName })
      .returning();
    return child.id;
  });

  return NextResponse.json({ ok: true, childId });
}
