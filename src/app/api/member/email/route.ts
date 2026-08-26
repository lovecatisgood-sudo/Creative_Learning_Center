import { and, desc, eq, gt, isNull, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, memberAccessTokens, memberAccounts, parents } from "@/db/schema";
import { requireMember, MemberUnauthorizedError } from "@/lib/member-auth";
import { normalizeEmail } from "@/lib/member-identity";
import { memberVerifyUrl } from "@/lib/member-links";
import { sendMemberAccessEmail } from "@/lib/member-mail";
import { expiresFromNow, generateAccessToken, hashAccessToken } from "@/lib/member-tokens";
import { isTrustedMutationOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  try {
    const member = await requireMember();
    const body = await request.json().catch(() => null);
    const email = normalizeEmail(String(body?.email ?? ""));
    if (!email) return NextResponse.json({ error: "Invalid email" }, { status: 422 });

    const [conflict] = await db
      .select({ id: memberAccounts.id })
      .from(memberAccounts)
      .where(and(eq(memberAccounts.emailNormalized, email), ne(memberAccounts.id, member.id)))
      .limit(1);
    // Authenticated request, but still avoid confirming another account's email.
    if (conflict) return NextResponse.json({ ok: true });

    const recent = await db
      .select({ id: memberAccessTokens.id })
      .from(memberAccessTokens)
      .where(and(
        eq(memberAccessTokens.memberAccountId, member.id),
        eq(memberAccessTokens.type, "email_verify"),
        gt(memberAccessTokens.createdAt, new Date(Date.now() - 10 * 60_000)),
      ))
      .orderBy(desc(memberAccessTokens.createdAt))
      .limit(3);
    if (recent.length >= 3) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const token = generateAccessToken();
    const [created] = await db
      .insert(memberAccessTokens)
      .values({
        memberAccountId: member.id,
        type: "email_verify",
        tokenHash: hashAccessToken(token),
        pendingEmail: email,
        expiresAt: expiresFromNow(20),
      })
      .returning({ id: memberAccessTokens.id });

    const [guardian] = await db.select({ name: parents.name }).from(parents).where(eq(parents.id, member.parentId)).limit(1);
    try {
      await sendMemberAccessEmail({
        to: email,
        memberName: guardian?.name || "Siamese Cat Member",
        accessUrl: memberVerifyUrl(token),
        language: member.preferredLanguage === "en" ? "en" : "th",
        purpose: "verify",
      });
    } catch {
      await db.delete(memberAccessTokens).where(eq(memberAccessTokens.id, created.id));
      console.error("Member verification email failed", { code: "MEMBER_EMAIL_DELIVERY_FAILED" });
      return NextResponse.json({ error: "Email delivery unavailable" }, { status: 503 });
    }

    await db.insert(auditLog).values({
      action: "member_email_verification_issued",
      entity: "member_account",
      entityId: member.id,
      detail: { tokenId: created.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MemberUnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw error;
  }
}
