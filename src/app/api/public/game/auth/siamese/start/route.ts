import { NextResponse } from "next/server";
import { createSiameseCatAuth } from "@siamesecat/member-auth";
import { getSiameseGameLoginConfig, siameseGameAuthTarget } from "@/lib/game-features";
import { siamesePopupResponse } from "@/lib/siamese-popup-response";
import { getSiameseTransactionSession } from "@/lib/siamese-game-transaction";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const game = siameseGameAuthTarget(requestUrl.searchParams.get("game"));
    const config = getSiameseGameLoginConfig(game);
    if (!config.enabled) return siamesePopupResponse(false, "Siamese Cat sign-in is not configured for this game.", 503);
    const appOrigin = new URL(process.env.APP_ORIGIN?.trim() || requestUrl.origin).origin;
    if (requestUrl.origin !== appOrigin) return siamesePopupResponse(false, "The game origin is not trusted.", 400);
    const callbackUrl = new URL("/api/public/game/auth/siamese/callback", appOrigin).toString();
    const client = createSiameseCatAuth(config);
    const { url, transaction } = await client.begin(callbackUrl, "/");
    const session = await getSiameseTransactionSession();
    session.transaction = transaction;
    session.language = requestUrl.searchParams.get("language") === "th" ? "th" : "en";
    session.game = game;
    await session.save();
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("Siamese Cat game sign-in could not start", error);
    return siamesePopupResponse(false, "The identity service is unavailable. Close this window and try again.", 503);
  }
}
