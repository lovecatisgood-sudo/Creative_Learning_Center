import { and, eq, gt, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, memberAccessTokens, memberAccounts, parents } from "@/db/schema";
import { establishMemberSession } from "@/lib/member-auth";
import { hashAccessToken } from "@/lib/member-tokens";
import { isTrustedMutationOrigin } from "@/lib/request-security";
import { isMemberSchemaReady } from "@/lib/member-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  if (!isMemberSchemaReady()) return NextResponse.json({ error: "Member service temporarily unavailable" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (token.length < 40 || token.length > 100) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  const now = new Date();
  let verified: null | { memberAccountId: number; sessionVersion: number; language: string } = null;
  try {
    verified = await db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          tokenId: memberAccessTokens.id,
          tokenType: memberAccessTokens.type,
          pendingEmail: memberAccessTokens.pendingEmail,
          memberAccountId: memberAccounts.id,
          parentId: memberAccounts.parentId,
          sessionVersion: memberAccounts.sessionVersion,
          language: memberAccounts.preferredLanguage,
          currentEmail: memberAccounts.emailNormalized,
        })
        .from(memberAccessTokens)
        .innerJoin(memberAccounts, eq(memberAccessTokens.memberAccountId, memberAccounts.id))
        .where(and(
          eq(memberAccessTokens.tokenHash, hashAccessToken(token)),
          or(eq(memberAccessTokens.type, "email_verify"), eq(memberAccessTokens.type, "email_signin")),
          isNull(memberAccessTokens.usedAt),
          gt(memberAccessTokens.expiresAt, now),
        ))
        .limit(1);
      if (!row) return null;
      const email = row.tokenType === "email_verify" ? row.pendingEmail : row.currentEmail;
      if (!email) return null;
      const [conflict] = await tx.select({ id: memberAccounts.id }).from(memberAccounts).where(eq(memberAccounts.emailNormalized, email)).limit(1);
      if (conflict && conflict.id !== row.memberAccountId) return null;
      const consumed = await tx.update(memberAccessTokens).set({ usedAt: now }).where(and(eq(memberAccessTokens.id, row.tokenId), isNull(memberAccessTokens.usedAt))).returning({ id: memberAccessTokens.id });
      if (consumed.length !== 1) return null;
      if (row.tokenType === "email_verify") {
        await tx.update(memberAccounts).set({ emailNormalized: email, emailVerifiedAt: now, lastAccessAt: now, updatedAt: now }).where(eq(memberAccounts.id, row.memberAccountId));
        await tx.update(parents).set({ email }).where(eq(parents.id, row.parentId));
      } else {
        await tx.update(memberAccounts).set({ lastAccessAt: now, updatedAt: now }).where(eq(memberAccounts.id, row.memberAccountId));
      }
      await tx.insert(auditLog).values({ action: row.tokenType === "email_verify" ? "member_email_verified" : "member_email_signin_consumed", entity: "member_account", entityId: row.memberAccountId, detail: { tokenId: row.tokenId } });
      return row;
    });
  } catch (error) {
    const dbError = error as { code?: string; cause?: { code?: string } };
    if (dbError.code !== "23505" && dbError.cause?.code !== "23505") throw error;
  }
  if (!verified) return NextResponse.json({ error: "Invalid or expired link" }, { status: 410 });
  await establishMemberSession(verified.memberAccountId, verified.sessionVersion, "verified");
  return NextResponse.json({ ok: true, language: verified.language === "en" ? "en" : "th" }, { headers: { "Cache-Control": "no-store" } });
}
