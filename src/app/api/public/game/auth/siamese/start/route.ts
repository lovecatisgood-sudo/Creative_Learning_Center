import { NextResponse } from "next/server";
import { createSiameseCatAuth } from "@siamesecat/member-auth";
import { withPrivateAuthHeaders } from "@/lib/auth-response";
import { getSiameseGameLoginConfig, siameseGameAuthTarget } from "@/lib/game-features";
import { memberOrigin } from "@/lib/member-links";
import { siamesePopupResponse } from "@/lib/siamese-popup-response";
import { getSiameseTransactionSession } from "@/lib/siamese-game-transaction";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  let failureCode = "GAME_OIDC_START_FAILED";
  try {
    const requestUrl = new URL(request.url);
    const game = siameseGameAuthTarget(requestUrl.searchParams.get("game"));
    const config = getSiameseGameLoginConfig(game);
    if (!config.enabled) return siamesePopupResponse(false, "Siamese Cat sign-in is not configured for this game.", 503);
    // Hostinger may construct request.url from its internal upstream host. The
    // configured public origin is the authority for OAuth callbacks; OIDC
    // state/PKCE and the server-side transaction protect this GET flow.
    const appOrigin = memberOrigin();
    const callbackUrl = new URL("/api/public/game/auth/siamese/callback", appOrigin).toString();
    const client = createSiameseCatAuth(config);
    failureCode = "GAME_OIDC_BEGIN_FAILED";
    const { url, transaction } = await client.begin(callbackUrl, "/");
    const session = await getSiameseTransactionSession();
    session.transaction = transaction;
    session.language = requestUrl.searchParams.get("language") === "th" ? "th" : "en";
    session.game = game;
    await session.save();
    return withPrivateAuthHeaders(NextResponse.redirect(url, { status: 302 }));
  } catch {
    console.error("Siamese Cat game sign-in could not start", { code: failureCode });
    return siamesePopupResponse(false, "The identity service is unavailable. Close this window and try again.", 503);
  }
}
