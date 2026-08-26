import { createSiameseCatAuth } from "@siamesecat/member-auth";
import { NextResponse } from "next/server";
import { canonicalPublicRequestUrl, finishValidatedAuthTransaction, withPrivateAuthHeaders } from "@/lib/auth-response";
import { establishMemberSession } from "@/lib/member-auth";
import { memberOrigin } from "@/lib/member-links";
import { failCreativeLinkAttempt, linkCreativeMemberProfile } from "@/lib/siamese-creative-link";
import { getSiameseCreativeAuthConfig } from "@/lib/siamese-creative-auth";
import { ensureSiameseMemberLinkSchema } from "@/lib/siamese-member-link-schema";
import { getMemberLinkTransactionSession } from "@/lib/siamese-member-link-transaction";
import { db } from "@/db";
import { memberAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  const appOrigin = memberOrigin();
  let correlationId = crypto.randomUUID();
  let returnTo = "/signup/success";
  let failureCode = "CREATIVE_CONNECT_CALLBACK_FAILED";
  try {
    const session = await getMemberLinkTransactionSession();
    const transaction = session.transaction;
    const memberAccountId = session.memberAccountId;
    correlationId = session.correlationId || correlationId;
    returnTo = session.returnTo || returnTo;
    if (!transaction || !memberAccountId) {
      failureCode = "CREATIVE_LINK_TRANSACTION_MISSING";
      throw new Error(failureCode);
    }
    failureCode = "CREATIVE_LINK_SCHEMA_UNAVAILABLE";
    if (!await ensureSiameseMemberLinkSchema()) throw new Error(failureCode);
    const config = getSiameseCreativeAuthConfig();
    if (!config.enabled) {
      failureCode = "CREATIVE_AUTH_UNAVAILABLE";
      throw new Error(failureCode);
    }
    failureCode = "CREATIVE_OIDC_CALLBACK_FAILED";
    const callbackUrl = canonicalPublicRequestUrl(request, appOrigin);
    const { identity } = await finishValidatedAuthTransaction(
      () => createSiameseCatAuth(config).finish(callbackUrl, transaction),
      () => session.destroy(),
    );
    failureCode = "CREATIVE_PROFILE_LINK_FAILED";
    await linkCreativeMemberProfile({ memberAccountId, identity, correlationId });
    failureCode = "CREATIVE_SESSION_ESTABLISH_FAILED";
    const [account] = await db.select({ sessionVersion: memberAccounts.sessionVersion }).from(memberAccounts).where(eq(memberAccounts.id, memberAccountId)).limit(1);
    if (account) await establishMemberSession(memberAccountId, account.sessionVersion, "verified");
    return privateRedirect(withStatus(returnTo, "linked", correlationId, appOrigin));
  } catch {
    console.error("Creative Siamese member connection callback failed", { code: failureCode, correlationId });
    await failCreativeLinkAttempt(correlationId, failureCode).catch(() => undefined);
    return privateRedirect(withStatus(returnTo, "pending", correlationId, appOrigin));
  }
}

function privateRedirect(url: URL) {
  return withPrivateAuthHeaders(NextResponse.redirect(url, { status: 303 }));
}

function withStatus(returnTo: string, status: "linked" | "pending", correlationId: string, origin: string): URL {
  const safe = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/signup/success";
  const url = new URL(safe, origin);
  url.searchParams.set("membership", status);
  if (status === "pending") url.searchParams.set("ref", correlationId);
  return url;
}
