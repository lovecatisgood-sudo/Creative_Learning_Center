import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, memberAccessTokens, memberAccounts } from "@/db/schema";
import { establishMemberSession } from "@/lib/member-auth";
import { hashAccessToken } from "@/lib/member-tokens";
import { isTrustedMutationOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (token.length < 40 || token.length > 100) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  const now = new Date();
  const claimed = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        tokenId: memberAccessTokens.id,
        memberAccountId: memberAccessTokens.memberAccountId,
        orderId: memberAccessTokens.orderId,
        sessionVersion: memberAccounts.sessionVersion,
        preferredLanguage: memberAccounts.preferredLanguage,
      })
      .from(memberAccessTokens)
      .innerJoin(memberAccounts, eq(memberAccessTokens.memberAccountId, memberAccounts.id))
      .where(and(
        eq(memberAccessTokens.tokenHash, hashAccessToken(token)),
        eq(memberAccessTokens.type, "purchase_claim"),
        isNull(memberAccessTokens.usedAt),
        gt(memberAccessTokens.expiresAt, now),
      ))
      .limit(1);
    if (!row) return null;
    const consumed = await tx.update(memberAccessTokens).set({ usedAt: now }).where(and(eq(memberAccessTokens.id, row.tokenId), isNull(memberAccessTokens.usedAt))).returning({ id: memberAccessTokens.id });
    if (consumed.length !== 1) return null;
    await tx.update(memberAccounts).set({ lastAccessAt: now, updatedAt: now }).where(eq(memberAccounts.id, row.memberAccountId));
    await tx.insert(auditLog).values({ action: "member_purchase_claim_consumed", entity: "member_account", entityId: row.memberAccountId, detail: { orderId: row.orderId } });
    return row;
  });
  if (!claimed) return NextResponse.json({ error: "Invalid or expired link" }, { status: 410 });
  await establishMemberSession(claimed.memberAccountId, claimed.sessionVersion, "temporary");
  return NextResponse.json({ ok: true, language: claimed.preferredLanguage === "en" ? "en" : "th" }, { headers: { "Cache-Control": "no-store" } });
}
