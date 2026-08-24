import { createSiameseCatAuth } from "@siamesecat/member-auth";
import { NextResponse } from "next/server";
import { establishMemberSession } from "@/lib/member-auth";
import { failCreativeLinkAttempt, linkCreativeMemberProfile } from "@/lib/siamese-creative-link";
import { getSiameseCreativeAuthConfig } from "@/lib/siamese-creative-auth";
import { ensureSiameseMemberLinkSchema } from "@/lib/siamese-member-link-schema";
import { getMemberLinkTransactionSession } from "@/lib/siamese-member-link-transaction";
import { db } from "@/db";
import { memberAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appOrigin = new URL(process.env.APP_ORIGIN?.trim() || requestUrl.origin).origin;
  let correlationId = crypto.randomUUID();
  let returnTo = "/signup/success";
  try {
    const session = await getMemberLinkTransactionSession();
    const transaction = session.transaction;
    const memberAccountId = session.memberAccountId;
    correlationId = session.correlationId || correlationId;
    returnTo = session.returnTo || returnTo;
    session.destroy();
    if (!transaction || !memberAccountId) throw new Error("Member link transaction missing or already used");
    if (!await ensureSiameseMemberLinkSchema()) throw new Error("Member link schema unavailable");
    const config = getSiameseCreativeAuthConfig();
    if (!config.enabled) throw new Error("Creative membership authentication unavailable");
    const { identity } = await createSiameseCatAuth(config).finish(requestUrl, transaction);
    await linkCreativeMemberProfile({ memberAccountId, identity, correlationId });
    const [account] = await db.select({ sessionVersion: memberAccounts.sessionVersion }).from(memberAccounts).where(eq(memberAccounts.id, memberAccountId)).limit(1);
    if (account) await establishMemberSession(memberAccountId, account.sessionVersion, "verified");
    return NextResponse.redirect(withStatus(returnTo, "linked", correlationId, appOrigin), { status: 303 });
  } catch (error) {
    console.error("Creative Siamese member connection callback failed", error);
    await failCreativeLinkAttempt(correlationId, error instanceof Error ? error.name : "LINK_FAILED").catch(() => undefined);
    return NextResponse.redirect(withStatus(returnTo, "pending", correlationId, appOrigin), { status: 303 });
  }
}

function withStatus(returnTo: string, status: "linked" | "pending", correlationId: string, origin: string): URL {
  const safe = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/signup/success";
  const url = new URL(safe, origin);
  url.searchParams.set("membership", status);
  if (status === "pending") url.searchParams.set("ref", correlationId);
  return url;
}
