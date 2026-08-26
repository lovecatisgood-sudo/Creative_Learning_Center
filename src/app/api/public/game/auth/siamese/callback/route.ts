import { createSiameseCatAuth } from "@siamesecat/member-auth";
import { canonicalPublicRequestUrl, finishValidatedAuthTransaction } from "@/lib/auth-response";
import { getSiameseGameLoginConfig } from "@/lib/game-features";
import { getGameSession } from "@/lib/game-session";
import { memberOrigin } from "@/lib/member-links";
import { SiameseAccountConflictError, findOrCreateSiameseGamePlayer } from "@/lib/siamese-game-player";
import { siamesePopupResponse } from "@/lib/siamese-popup-response";
import { getSiameseTransactionSession } from "@/lib/siamese-game-transaction";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  let failureCode = "GAME_OIDC_CALLBACK_FAILED";
  try {
    const transactionSession = await getSiameseTransactionSession();
    const transaction = transactionSession.transaction;
    const language = transactionSession.language === "th" ? "th" : "en";
    const game = transactionSession.game ?? "cat-vs-dog";
    if (!transaction) return siamesePopupResponse(false, "This sign-in attempt is missing or has already been used.", 400);

    const config = getSiameseGameLoginConfig(game);
    if (!config.enabled) return siamesePopupResponse(false, "Siamese Cat sign-in is not configured for this game.", 503);
    failureCode = "GAME_OIDC_CODE_EXCHANGE_FAILED";
    const callbackUrl = canonicalPublicRequestUrl(request, memberOrigin());
    const { identity } = await finishValidatedAuthTransaction(
      () => createSiameseCatAuth(config).finish(callbackUrl, transaction),
      () => transactionSession.destroy(),
    );
    failureCode = "GAME_PLAYER_LINK_FAILED";
    const player = await findOrCreateSiameseGamePlayer(identity, language, game);
    failureCode = "GAME_SESSION_ESTABLISH_FAILED";
    const gameSession = await getGameSession();
    gameSession.playerPublicId = player.publicId;
    await gameSession.save();
    return siamesePopupResponse(true, "You are signed in. Return to the game to continue.");
  } catch (error) {
    if (error instanceof SiameseAccountConflictError) {
      return siamesePopupResponse(false, error.message, 409);
    }
    console.error("Siamese Cat game callback failed", { code: failureCode });
    return siamesePopupResponse(false, "Sign-in verification failed. Return to the game and retry.", 401);
  }
}
