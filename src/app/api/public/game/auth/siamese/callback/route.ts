import { createSiameseCatAuth } from "@siamesecat/member-auth";
import { getSiameseGameLoginConfig } from "@/lib/game-features";
import { getGameSession } from "@/lib/game-session";
import { SiameseAccountConflictError, findOrCreateSiameseGamePlayer } from "@/lib/siamese-game-player";
import { siamesePopupResponse } from "@/lib/siamese-popup-response";
import { getSiameseTransactionSession } from "@/lib/siamese-game-transaction";

export async function GET(request: Request) {
  try {
    const transactionSession = await getSiameseTransactionSession();
    const transaction = transactionSession.transaction;
    const language = transactionSession.language === "th" ? "th" : "en";
    const game = transactionSession.game ?? "cat-vs-dog";
    transactionSession.destroy();
    if (!transaction) return siamesePopupResponse(false, "This sign-in attempt is missing or has already been used.", 400);

    const config = getSiameseGameLoginConfig(game);
    if (!config.enabled) return siamesePopupResponse(false, "Siamese Cat sign-in is not configured for this game.", 503);
    const { identity } = await createSiameseCatAuth(config).finish(new URL(request.url), transaction);
    const player = await findOrCreateSiameseGamePlayer(identity, language);
    const gameSession = await getGameSession();
    gameSession.playerPublicId = player.publicId;
    await gameSession.save();
    return siamesePopupResponse(true, "You are signed in. Return to the game to continue.");
  } catch (error) {
    if (error instanceof SiameseAccountConflictError) {
      return siamesePopupResponse(false, error.message, 409);
    }
    console.error("Siamese Cat game callback failed", error);
    return siamesePopupResponse(false, "Sign-in verification failed. Return to the game and retry.", 401);
  }
}
