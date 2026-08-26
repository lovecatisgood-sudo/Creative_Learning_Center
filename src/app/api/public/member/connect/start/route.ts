import { createSiameseCatAuth } from "@siamesecat/member-auth";
import { NextResponse } from "next/server";
import { withPrivateAuthHeaders } from "@/lib/auth-response";
import { getCurrentMember } from "@/lib/member-auth";
import { memberOrigin } from "@/lib/member-links";
import { recordCreativeLinkAttempt } from "@/lib/siamese-creative-link";
import { getSiameseCreativeAuthConfig } from "@/lib/siamese-creative-auth";
import { ensureSiameseMemberLinkSchema } from "@/lib/siamese-member-link-schema";
import { bindMemberLinkToCurrentMember, getMemberLinkTransactionSession } from "@/lib/siamese-member-link-transaction";
import { isTrustedMutationOrigin } from "@/lib/request-security";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  return startConnection(request);
}

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return withPrivateAuthHeaders(NextResponse.json({ error: "Forbidden origin" }, { status: 403 }));
  }
  return startConnection(request);
}

async function startConnection(request: Request) {
  const appOrigin = memberOrigin();
  const fallback = new URL("/signup/success?membership=pending", appOrigin);
  let failureCode = "CREATIVE_CONNECT_START_FAILED";
  try {
    const config = getSiameseCreativeAuthConfig();
    if (!config.enabled) return privateRedirect(fallback, 303);
    failureCode = "CREATIVE_LINK_SCHEMA_UNAVAILABLE";
    if (!await ensureSiameseMemberLinkSchema()) return privateRedirect(fallback, 303);
    const session = await getMemberLinkTransactionSession();
    const requestedFlow = new URL(request.url).searchParams.get("flow");
    if (requestedFlow && requestedFlow !== session.correlationId) {
      failureCode = "CREATIVE_LINK_FLOW_MISMATCH";
      throw new Error(failureCode);
    }
    const current = await getCurrentMember();
    if (!current) return privateRedirect(new URL("/member/sign-in", appOrigin), 303);
    bindMemberLinkToCurrentMember(session, current);
    failureCode = "CREATIVE_LINK_ATTEMPT_RECORD_FAILED";
    await recordCreativeLinkAttempt(session.memberAccountId, session.correlationId);
    const callbackUrl = new URL("/api/public/member/connect/callback", appOrigin).toString();
    failureCode = "CREATIVE_OIDC_BEGIN_FAILED";
    const { url, transaction } = await createSiameseCatAuth(config).begin(callbackUrl, session.returnTo || "/signup/success?membership=linked");
    session.transaction = transaction;
    await session.save();
    return privateRedirect(url, 302);
  } catch {
    console.error("Creative Siamese member connection could not start", { code: failureCode });
    return privateRedirect(fallback, 303);
  }
}

function privateRedirect(url: URL | string, status: 302 | 303) {
  return withPrivateAuthHeaders(NextResponse.redirect(url, { status }));
}
