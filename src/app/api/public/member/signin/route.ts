import { and, desc, eq, gt, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { withPrivateAuthHeaders } from "@/lib/auth-response";
import { db } from "@/db";
import { auditLog, memberAccessTokens, memberAccounts, parents } from "@/db/schema";
import { normalizeEmail } from "@/lib/member-identity";
import { memberVerifyUrl } from "@/lib/member-links";
import { sendMemberAccessEmail } from "@/lib/member-mail";
import { expiresFromNow, generateAccessToken, hashAccessToken } from "@/lib/member-tokens";
import { isTrustedMutationOrigin } from "@/lib/request-security";
import { ensureMemberSchemaReady } from "@/lib/member-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const GENERIC = { ok: true };

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) return privateJson({ error: "Forbidden origin", retryable: false }, 403);
  if (!await ensureMemberSchemaReady()) return privateJson({ error: "Member service temporarily unavailable", retryable: true }, 503);
  try {
    const body = await request.json().catch(() => null);
    const email = normalizeEmail(String(body?.email ?? ""));
    if (!email) return genericAccepted();

    const [account] = await db
      .select({
        id: memberAccounts.id,
        parentId: memberAccounts.parentId,
        language: memberAccounts.preferredLanguage,
      })
      .from(memberAccounts)
      .where(and(
        eq(memberAccounts.emailNormalized, email),
        isNotNull(memberAccounts.emailVerifiedAt),
      ))
      .limit(1);
    if (!account) return genericAccepted();

    const recent = await db
      .select({ id: memberAccessTokens.id })
      .from(memberAccessTokens)
      .where(and(
        eq(memberAccessTokens.memberAccountId, account.id),
        eq(memberAccessTokens.type, "email_signin"),
        gt(memberAccessTokens.createdAt, new Date(Date.now() - 10 * 60_000)),
      ))
      .orderBy(desc(memberAccessTokens.createdAt))
      .limit(3);
    if (recent.length >= 3) return genericAccepted();

    const token = generateAccessToken();
    const [created] = await db
      .insert(memberAccessTokens)
      .values({
        memberAccountId: account.id,
        type: "email_signin",
        tokenHash: hashAccessToken(token),
        pendingEmail: email,
        expiresAt: expiresFromNow(20),
      })
      .returning({ id: memberAccessTokens.id });
    const [guardian] = await db.select({ name: parents.name }).from(parents).where(eq(parents.id, account.parentId)).limit(1);
    try {
      await sendMemberAccessEmail({
        to: email,
        memberName: guardian?.name || "Siamese Cat Member",
        accessUrl: memberVerifyUrl(token),
        language: account.language === "en" ? "en" : "th",
        purpose: "signin",
      });
    } catch {
      await db.delete(memberAccessTokens).where(eq(memberAccessTokens.id, created.id));
      console.error("Member sign-in email failed", { code: "MEMBER_EMAIL_DELIVERY_FAILED" });
      const response = privateJson({ error: "Email delivery is temporarily unavailable", retryable: true }, 503);
      response.headers.set("Retry-After", "60");
      return response;
    }
    await db.insert(auditLog).values({
      action: "member_email_signin_issued",
      entity: "member_account",
      entityId: account.id,
      detail: { tokenId: created.id },
    }).catch(() => console.error("Member sign-in audit failed", { code: "MEMBER_EMAIL_AUDIT_FAILED" }));
    return genericAccepted();
  } catch {
    console.error("Member sign-in request failed", { code: "MEMBER_SIGNIN_SERVICE_FAILED" });
    return privateJson({ error: "Member sign-in is temporarily unavailable", retryable: true }, 503);
  }
}

function genericAccepted() {
  return privateJson(GENERIC, 202);
}

function privateJson(body: object, status: number) {
  return withPrivateAuthHeaders(NextResponse.json(body, { status }));
}
