import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { gamePlayers } from "@/db/schema";
import { getGameLoginConfig } from "@/lib/game-features";
import { getGameSession } from "@/lib/game-session";

const googleClient = new OAuth2Client();

export async function POST(request: Request) {
  const feature = getGameLoginConfig();
  if (!feature.enabled) {
    return NextResponse.json({ error: "Game sign-in is not available" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.acceptTerms !== true) {
    return NextResponse.json({ error: "Terms acceptance is required" }, { status: 422 });
  }

  const credential = String(body.credential ?? "").trim();
  if (!credential) return NextResponse.json({ error: "Missing Google credential" }, { status: 422 });

  let payload: Awaited<ReturnType<typeof verifyGoogleCredential>>;
  try {
    payload = await verifyGoogleCredential(credential, feature.googleClientId);
  } catch (error) {
    console.warn("Google game credential verification failed", error);
    return NextResponse.json({ error: "Unable to verify Google sign-in" }, { status: 401 });
  }

  const googleSub = String(payload?.sub ?? "");
  const email = String(payload?.email ?? "").trim().toLowerCase();
  const displayName = String(payload?.name ?? email.split("@")[0] ?? "Player").trim().slice(0, 40);
  const avatarUrl = String(payload?.picture ?? "").trim().slice(0, 2_000);
  const language = body.language === "th" ? "th" : "en";
  if (!googleSub || !email || payload?.email_verified !== true) {
    return NextResponse.json({ error: "A verified Google email is required" }, { status: 422 });
  }

  try {
    const now = new Date();
    const player = await db.transaction(async (tx) => {
      const [byGoogle] = await tx.select().from(gamePlayers).where(eq(gamePlayers.googleSub, googleSub)).limit(1);
      if (byGoogle) {
        const [updated] = await tx
          .update(gamePlayers)
          .set({ email, displayName, avatarUrl, language, updatedAt: now })
          .where(eq(gamePlayers.id, byGoogle.id))
          .returning();
        return updated;
      }

      const [byEmail] = await tx.select().from(gamePlayers).where(eq(gamePlayers.email, email)).limit(1);
      if (byEmail?.googleSub && byEmail.googleSub !== googleSub) {
        throw new GoogleAccountConflictError();
      }
      if (byEmail) {
        const [linked] = await tx
          .update(gamePlayers)
          .set({ googleSub, displayName, avatarUrl, language, termsAcceptedAt: now, updatedAt: now })
          .where(eq(gamePlayers.id, byEmail.id))
          .returning();
        return linked;
      }

      const [created] = await tx
        .insert(gamePlayers)
        .values({
          publicId: randomUUID(),
          googleSub,
          displayName,
          email,
          avatarUrl,
          language,
          marketingConsent: false,
          termsAcceptedAt: now,
          updatedAt: now,
        })
        .returning();
      return created;
    });

    const session = await getGameSession();
    session.playerPublicId = player.publicId;
    await session.save();

    return NextResponse.json(
      {
        ok: true,
        player: {
          publicId: player.publicId,
          displayName: player.displayName,
          avatarUrl: player.avatarUrl,
        },
      },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof GoogleAccountConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Google game sign-in persistence failed", error);
    return NextResponse.json({ error: "Game sign-in is temporarily unavailable" }, { status: 503 });
  }
}

async function verifyGoogleCredential(idToken: string, audience: string) {
  const ticket = await googleClient.verifyIdToken({ idToken, audience });
  return ticket.getPayload();
}

class GoogleAccountConflictError extends Error {
  constructor() {
    super("This email is already linked to another Google account");
    this.name = "GoogleAccountConflictError";
  }
}
