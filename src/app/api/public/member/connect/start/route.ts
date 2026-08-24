import { createSiameseCatAuth } from "@siamesecat/member-auth";
import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/member-auth";
import { memberOrigin } from "@/lib/member-links";
import { recordCreativeLinkAttempt } from "@/lib/siamese-creative-link";
import { getSiameseCreativeAuthConfig } from "@/lib/siamese-creative-auth";
import { ensureSiameseMemberLinkSchema } from "@/lib/siamese-member-link-schema";
import { getMemberLinkTransactionSession } from "@/lib/siamese-member-link-transaction";

export async function GET() {
  const appOrigin = memberOrigin();
  const fallback = new URL("/signup/success?membership=pending", appOrigin);
  try {
    const config = getSiameseCreativeAuthConfig();
    if (!config.enabled) return NextResponse.redirect(fallback, { status: 303 });
    if (!await ensureSiameseMemberLinkSchema()) return NextResponse.redirect(fallback, { status: 303 });
    const session = await getMemberLinkTransactionSession();
    if (!session.memberAccountId) {
      const current = await getCurrentMember();
      if (!current) return NextResponse.redirect(new URL("/member/sign-in", appOrigin), { status: 303 });
      session.memberAccountId = current.id;
      session.correlationId = crypto.randomUUID();
      session.language = current.preferredLanguage === "en" ? "en" : "th";
      session.returnTo = current.preferredLanguage === "en" ? "/EN/member?membership=linked" : "/member?membership=linked";
    }
    if (!session.correlationId) session.correlationId = crypto.randomUUID();
    await recordCreativeLinkAttempt(session.memberAccountId, session.correlationId);
    const callbackUrl = new URL("/api/public/member/connect/callback", appOrigin).toString();
    const { url, transaction } = await createSiameseCatAuth(config).begin(callbackUrl, session.returnTo || "/signup/success?membership=linked");
    session.transaction = transaction;
    await session.save();
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("Creative Siamese member connection could not start", error);
    return NextResponse.redirect(fallback, { status: 303 });
  }
}
