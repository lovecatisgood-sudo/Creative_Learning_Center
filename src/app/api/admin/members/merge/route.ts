import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  auditLog,
  children,
  memberAccessTokens,
  memberAccounts,
  memberConsents,
  memberUidAliases,
  orders,
  packageInstances,
  parents,
} from "@/db/schema";
import { ForbiddenError, requireManager, UnauthorizedError } from "@/lib/auth";
import { normalizeMemberUid } from "@/lib/member-identity";
import { isTrustedMutationOrigin } from "@/lib/request-security";
import { isMemberSchemaReady } from "@/lib/member-schema";

async function resolveMember(uid: string) {
  const [direct] = await db.select().from(memberAccounts).where(eq(memberAccounts.publicUid, uid)).limit(1);
  if (direct) return direct;
  const [alias] = await db
    .select({ account: memberAccounts })
    .from(memberUidAliases)
    .innerJoin(memberAccounts, eq(memberUidAliases.memberAccountId, memberAccounts.id))
    .where(eq(memberUidAliases.publicUid, uid))
    .limit(1);
  return alias?.account ?? null;
}

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  let manager: Awaited<ReturnType<typeof requireManager>>;
  try {
    manager = await requireManager();
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: "Manager access required" }, { status: 403 });
    throw error;
  }
  if (!isMemberSchemaReady()) return NextResponse.json({ error: "Member service temporarily unavailable" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const sourceUid = normalizeMemberUid(String(body?.sourceUid ?? ""));
  const targetUid = normalizeMemberUid(String(body?.targetUid ?? ""));
  if (!sourceUid || !targetUid || sourceUid === targetUid || body?.confirmed !== true) {
    return NextResponse.json({ error: "Valid source, target, and confirmation are required" }, { status: 422 });
  }
  const [source, target] = await Promise.all([resolveMember(sourceUid), resolveMember(targetUid)]);
  if (!source || !target || source.id === target.id) return NextResponse.json({ error: "Member not found or already merged" }, { status: 404 });
  if (source.emailNormalized && target.emailNormalized && source.emailNormalized !== target.emailNormalized) {
    return NextResponse.json({ error: "Both members have different verified emails; resolve identity before merging" }, { status: 409 });
  }

  await db.transaction(async (tx) => {
    const now = new Date();
    await tx.update(children).set({ parentId: target.parentId }).where(eq(children.parentId, source.parentId));
    await tx.update(orders).set({ parentId: target.parentId }).where(eq(orders.parentId, source.parentId));
    await tx.update(packageInstances).set({ ownerParentId: target.parentId }).where(eq(packageInstances.ownerParentId, source.parentId));
    await tx.update(memberConsents).set({ memberAccountId: target.id }).where(eq(memberConsents.memberAccountId, source.id));
    await tx.update(memberUidAliases).set({ memberAccountId: target.id }).where(eq(memberUidAliases.memberAccountId, source.id));
    await tx.insert(memberUidAliases).values({ memberAccountId: target.id, publicUid: source.publicUid }).onConflictDoNothing();
    await tx.delete(memberAccessTokens).where(eq(memberAccessTokens.memberAccountId, source.id));

    const inheritedEmail = target.emailNormalized || source.emailNormalized;
    const inheritedVerifiedAt = target.emailVerifiedAt || source.emailVerifiedAt;
    await tx.update(memberAccounts).set({
      emailNormalized: inheritedEmail,
      emailVerifiedAt: inheritedVerifiedAt,
      sessionVersion: target.sessionVersion + 1,
      updatedAt: now,
    }).where(eq(memberAccounts.id, target.id));
    if (inheritedEmail) await tx.update(parents).set({ email: inheritedEmail }).where(eq(parents.id, target.parentId));

    await tx.delete(memberAccounts).where(eq(memberAccounts.id, source.id));
    await tx.delete(parents).where(eq(parents.id, source.parentId));
    await tx.insert(auditLog).values({
      adminId: manager.id > 0 ? manager.id : null,
      action: "member_accounts_merged",
      entity: "member_account",
      entityId: target.id,
      detail: { sourceMemberId: source.id, sourceUid: source.publicUid, targetUid: target.publicUid },
    });
  });
  return NextResponse.json({ ok: true, memberId: target.id, parentId: target.parentId, memberUid: target.publicUid });
}
