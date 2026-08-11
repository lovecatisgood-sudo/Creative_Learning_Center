import { and, desc, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, memberAccessTokens, memberAccounts, parents } from "@/db/schema";
import { normalizeEmail } from "@/lib/member-identity";
import { memberVerifyUrl } from "@/lib/member-links";
import { sendMemberAccessEmail } from "@/lib/member-mail";
import { expiresFromNow, generateAccessToken, hashAccessToken } from "@/lib/member-tokens";
import { isTrustedMutationOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
const GENERIC = { ok: true };

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(String(body?.email ?? ""));
  if (!email) return NextResponse.json(GENERIC);

  const [account] = await db
    .select({
      id: memberAccounts.id,
      parentId: memberAccounts.parentId,
      language: memberAccounts.preferredLanguage,
    })
    .from(memberAccounts)
    .where(eq(memberAccounts.emailNormalized, email))
    .limit(1);
  if (!account) return NextResponse.json(GENERIC);

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
  if (recent.length >= 3) return NextResponse.json(GENERIC);

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
    await db.insert(auditLog).values({
      action: "member_email_signin_issued",
      entity: "member_account",
      entityId: account.id,
      detail: { tokenId: created.id },
    });
  } catch (error) {
    await db.delete(memberAccessTokens).where(eq(memberAccessTokens.id, created.id));
    console.error("member sign-in email failed", error);
  }
  return NextResponse.json(GENERIC);
}
