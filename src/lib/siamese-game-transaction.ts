import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import type { SiameseCatLoginTransaction } from "@siamesecat/member-auth";
import { getSiameseGameTransactionSecret, type SiameseGameAuthTarget } from "@/lib/game-features";

type TransactionSession = { transaction?: SiameseCatLoginTransaction; language?: "en" | "th"; game?: SiameseGameAuthTarget };

export async function getSiameseTransactionSession() {
  const transactionSecret = getSiameseGameTransactionSecret();
  return getIronSession<TransactionSession>(await cookies(), {
    password: transactionSecret,
    cookieName: "scvd_siamese_oidc",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/public/game/auth/siamese",
      maxAge: 10 * 60,
    },
  });
}
