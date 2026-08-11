import { NextResponse } from "next/server";
import { db } from "@/db";
import { parents, children, memberAccounts, auditLog } from "@/db/schema";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { generateMemberUid, normalizePhone } from "@/lib/member-identity";
import { isTrustedMutationOrigin } from "@/lib/request-security";

// A2b — quick add child (two fields). Creates a stub parent keyed by phone,
// flagged profile_complete = false, and links the child to it so the child
// carries its contact phone and can be sold to immediately. Staff completes
// the parent details (or links to an existing parent by phone) later.
export async function POST(req: Request) {
  if (!isTrustedMutationOrigin(req)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  let adminId: number;
  try {
    adminId = await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const childName = String(body?.childName ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const phoneNormalized = normalizePhone(phone);
  if (!childName || !phone || !phoneNormalized) {
    return NextResponse.json({ error: "Child name and phone are required" }, { status: 422 });
  }

  if (body?.allowDuplicate !== true) {
    const matches = await db
      .select({ publicUid: memberAccounts.publicUid, parentId: memberAccounts.parentId })
      .from(memberAccounts)
      .where(eq(memberAccounts.phoneNormalized, phoneNormalized))
      .limit(5);
    if (matches.length > 0) {
      return NextResponse.json({ error: "possible_duplicate", matches }, { status: 409 });
    }
  }

  const created = await db.transaction(async (tx) => {
    const [stubParent] = await tx
      .insert(parents)
      .values({ name: "", phone, email: null, profileComplete: false })
      .returning();
    const [member] = await tx
      .insert(memberAccounts)
      .values({
        parentId: stubParent.id,
        publicUid: generateMemberUid(),
        phoneNormalized,
        preferredLanguage: "th",
      })
      .returning();
    const [child] = await tx
      .insert(children)
      .values({ parentId: stubParent.id, name: childName })
      .returning();
    await tx.insert(auditLog).values({
      adminId: adminId > 0 ? adminId : null,
      action: "temporary_member_created",
      entity: "member_account",
      entityId: member.id,
      detail: { childId: child.id },
    });
    return { childId: child.id, memberUid: member.publicUid };
  });

  return NextResponse.json({ ok: true, ...created });
}
