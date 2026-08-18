import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gamePlayers } from "@/db/schema";

type GameSession = {
  playerPublicId?: string;
};

function getGameSessionOptions(): SessionOptions {
  const configured = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!configured || configured.length < 32)) {
    throw new Error("SESSION_SECRET must be at least 32 characters for game sessions");
  }
  return {
    password: configured || "insecure-dev-secret-change-me-32chars!!",
    cookieName: "scvd_player",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    },
  };
}

export async function getGameSession() {
  return getIronSession<GameSession>(await cookies(), getGameSessionOptions());
}

export async function getCurrentGamePlayer() {
  const session = await getGameSession();
  if (!session.playerPublicId) return null;
  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.publicId, session.playerPublicId))
    .limit(1);
  return player ?? null;
}
