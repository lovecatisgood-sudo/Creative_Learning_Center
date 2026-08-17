import { NextResponse } from "next/server";
import { db } from "@/db";
import { children, parents, orders, memberAccounts, memberAccessTokens, memberConsents, memberUidAliases, auditLog } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";
import { generateMemberUid, normalizeEmail } from "@/lib/member-identity";
import { toBkk } from "@/lib/time";
import { isTrustedMutationOrigin } from "@/lib/request-security";
import { ensureMemberSchemaReady } from "@/lib/member-schema";

function bkkTodayISO(): string {
  const today = toBkk(new Date());
  return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
}

// Completes or links a fast-created child's parent (UI/UX A2b / A3 banner).
// Two modes:
//   { mode: "complete", parentName, email?, dob?, gender? }
//     → fills the stub parent and flips profile_complete = true; optionally
//       backfills the child's dob/gender.
//   { mode: "link", linkPhone }
//     → repoints the child to an existing complete parent matched by phone and
//       removes the now-orphaned stub parent.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationOrigin(req)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  let adminId: number;
  try {
    adminId = await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const { id } = await params;
  const childId = Number(id);
  if (!Number.isInteger(childId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const mode = body?.mode;

  const [child] = await db.select().from(children).where(eq(children.id, childId)).limit(1);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const memberSchemaReady = await ensureMemberSchemaReady();

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
      if (oldStubId && oldStubId !== target.id) {
        await tx.update(orders).set({ parentId: target.id }).where(eq(orders.parentId, oldStubId));
      }
      // Remove the stub only if no other child still references it.
      if (oldStubId && oldStubId !== target.id) {
        const others = await tx
          .select({ id: children.id })
          .from(children)
          .where(and(eq(children.parentId, oldStubId), ne(children.id, childId)))
          .limit(1);
        if (others.length === 0) {
          if (memberSchemaReady) {
            const [oldMember] = await tx.select({ id: memberAccounts.id, publicUid: memberAccounts.publicUid }).from(memberAccounts).where(eq(memberAccounts.parentId, oldStubId)).limit(1);
            if (oldMember) {
              const [targetMember] = await tx.select({ id: memberAccounts.id }).from(memberAccounts).where(eq(memberAccounts.parentId, target.id)).limit(1);
              if (targetMember) {
                await tx.update(memberUidAliases).set({ memberAccountId: targetMember.id }).where(eq(memberUidAliases.memberAccountId, oldMember.id));
                await tx.insert(memberUidAliases).values({ memberAccountId: targetMember.id, publicUid: oldMember.publicUid }).onConflictDoNothing();
              } else {
                await tx.delete(memberUidAliases).where(eq(memberUidAliases.memberAccountId, oldMember.id));
              }
              await tx.delete(memberAccessTokens).where(eq(memberAccessTokens.memberAccountId, oldMember.id));
              await tx.delete(memberConsents).where(eq(memberConsents.memberAccountId, oldMember.id));
              await tx.delete(memberAccounts).where(eq(memberAccounts.id, oldMember.id));
            }
          }
          await tx.delete(parents).where(eq(parents.id, oldStubId));
        }
      }
      await tx.insert(auditLog).values({
        adminId: adminId > 0 ? adminId : null,
        action: "temporary_member_linked",
        entity: "parent",
        entityId: target.id,
        detail: { childId, oldParentId: oldStubId },
      });
    });

    return NextResponse.json({ ok: true, parentId: target.id });
  }

  // Default: complete the stub parent in place.
  const parentName = String(body?.parentName ?? "").trim();
  if (!parentName) return NextResponse.json({ error: "parentName required" }, { status: 422 });
  const rawEmail = String(body?.email ?? "").trim();
  const email = rawEmail ? normalizeEmail(rawEmail) : null;
  if (rawEmail && !email) return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  const dob = body?.dob ? String(body.dob) : undefined;
  const gender = body?.gender === "male" || body?.gender === "female" ? body.gender : undefined;
  if (!dob || !gender || body?.consentAccepted !== true) {
    return NextResponse.json({ error: "Complete child details and consent are required" }, { status: 422 });
  }
  if (dob > bkkTodayISO()) return NextResponse.json({ error: "Invalid date of birth" }, { status: 422 });

  await db.transaction(async (tx) => {
    if (child.parentId) {
      await tx
        .update(parents)
        .set({ name: parentName, email, profileComplete: true })
        .where(eq(parents.id, child.parentId));
      if (memberSchemaReady) {
        const [member] = await tx.select({ id: memberAccounts.id }).from(memberAccounts).where(eq(memberAccounts.parentId, child.parentId)).limit(1);
        if (member) {
        await tx.insert(memberConsents).values([
          { memberAccountId: member.id, type: "terms", policyVersion: process.env.TERMS_VERSION || "2026-08-11", source: "staff", adminId: adminId > 0 ? adminId : null },
          { memberAccountId: member.id, type: "privacy", policyVersion: process.env.PRIVACY_VERSION || "2026-08-11", source: "staff", adminId: adminId > 0 ? adminId : null },
        ]);
        }
      }
    } else {
      const [p] = await tx
        .insert(parents)
        .values({ name: parentName, phone: "", email, profileComplete: true })
        .returning();
      if (memberSchemaReady) {
        const [member] = await tx.insert(memberAccounts).values({
          parentId: p.id,
          publicUid: generateMemberUid(),
          phoneNormalized: "",
          preferredLanguage: "th",
        }).returning({ id: memberAccounts.id });
        await tx.insert(memberConsents).values([
          { memberAccountId: member.id, type: "terms", policyVersion: process.env.TERMS_VERSION || "2026-08-11", source: "staff", adminId: adminId > 0 ? adminId : null },
          { memberAccountId: member.id, type: "privacy", policyVersion: process.env.PRIVACY_VERSION || "2026-08-11", source: "staff", adminId: adminId > 0 ? adminId : null },
        ]);
      }
      await tx.update(children).set({ parentId: p.id }).where(eq(children.id, childId));
    }
    if (dob !== undefined || gender !== undefined) {
      await tx
        .update(children)
        .set({ ...(dob !== undefined ? { dob } : {}), ...(gender !== undefined ? { gender } : {}) })
        .where(eq(children.id, childId));
    }
    await tx.insert(auditLog).values({
      adminId: adminId > 0 ? adminId : null,
      action: "member_profile_completed",
      entity: "child",
      entityId: childId,
      detail: { parentId: child.parentId },
    });
  });

  return NextResponse.json({ ok: true });
}
