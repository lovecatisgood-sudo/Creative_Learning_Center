import { NextResponse } from "next/server";
import { db } from "@/db";
import { children, parents } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// Completes or links a fast-created child's parent (UI/UX A2b / A3 banner).
// Two modes:
//   { mode: "complete", parentName, email?, dob?, gender? }
//     → fills the stub parent and flips profile_complete = true; optionally
//       backfills the child's dob/gender.
//   { mode: "link", linkPhone }
//     → repoints the child to an existing complete parent matched by phone and
//       removes the now-orphaned stub parent.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const childId = Number(params.id);
  if (!Number.isInteger(childId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const mode = body?.mode;

  const [child] = await db.select().from(children).where(eq(children.id, childId)).limit(1);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (mode === "link") {
    const linkPhone = String(body?.linkPhone ?? "").trim();
    if (!linkPhone) return NextResponse.json({ error: "linkPhone required" }, { status: 422 });

    // Match a *complete* parent by phone, excluding this child's own stub.
    const candidates = await db
      .select()
      .from(parents)
      .where(and(eq(parents.phone, linkPhone), eq(parents.profileComplete, true)));
    const target = candidates.find((p) => p.id !== child.parentId);
    if (!target) return NextResponse.json({ error: "No matching parent" }, { status: 404 });

    await db.transaction(async (tx) => {
      const oldStubId = child.parentId;
      await tx.update(children).set({ parentId: target.id }).where(eq(children.id, childId));
      // Remove the stub only if no other child still references it.
      if (oldStubId && oldStubId !== target.id) {
        const others = await tx
          .select({ id: children.id })
          .from(children)
          .where(and(eq(children.parentId, oldStubId), ne(children.id, childId)))
          .limit(1);
        if (others.length === 0) {
          await tx.delete(parents).where(eq(parents.id, oldStubId));
        }
      }
    });

    return NextResponse.json({ ok: true, parentId: target.id });
  }

  // Default: complete the stub parent in place.
  const parentName = String(body?.parentName ?? "").trim();
  if (!parentName) return NextResponse.json({ error: "parentName required" }, { status: 422 });
  const email = String(body?.email ?? "").trim() || null;
  const dob = body?.dob ? String(body.dob) : undefined;
  const gender = body?.gender === "male" || body?.gender === "female" ? body.gender : undefined;

  await db.transaction(async (tx) => {
    if (child.parentId) {
      await tx
        .update(parents)
        .set({ name: parentName, email, profileComplete: true })
        .where(eq(parents.id, child.parentId));
    } else {
      const [p] = await tx
        .insert(parents)
        .values({ name: parentName, phone: "", email, profileComplete: true })
        .returning();
      await tx.update(children).set({ parentId: p.id }).where(eq(children.id, childId));
    }
    if (dob !== undefined || gender !== undefined) {
      await tx
        .update(children)
        .set({ ...(dob !== undefined ? { dob } : {}), ...(gender !== undefined ? { gender } : {}) })
        .where(eq(children.id, childId));
    }
  });

  return NextResponse.json({ ok: true });
}
