import { randomUUID } from "node:crypto";
import type { SiameseCatIdentity } from "@siamesecat/member-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { gamePlayers } from "@/db/schema";

export async function findOrCreateSiameseGamePlayer(identity: SiameseCatIdentity, language: "en" | "th") {
  const email = identity.email.trim().toLowerCase();
  const now = new Date();
  return db.transaction(async (tx) => {
    const [byIdentity] = await tx
      .select()
      .from(gamePlayers)
      .where(and(eq(gamePlayers.siameseIssuer, identity.issuer), eq(gamePlayers.siameseSubject, identity.subject)))
      .limit(1);
    if (byIdentity) {
      const [emailOwner] = await tx.select().from(gamePlayers).where(eq(gamePlayers.email, email)).limit(1);
      if (emailOwner && emailOwner.id !== byIdentity.id) throw new SiameseAccountConflictError();
      const [updated] = await tx
        .update(gamePlayers)
        .set({ email, language, updatedAt: now })
        .where(eq(gamePlayers.id, byIdentity.id))
        .returning();
      return updated;
    }

    // Email alone is not sufficient proof to attach a new OIDC subject to an
    // existing Google/game account. Linking requires a separate authenticated flow.
    const [emailOwner] = await tx.select().from(gamePlayers).where(eq(gamePlayers.email, email)).limit(1);
    if (emailOwner) throw new SiameseAccountConflictError();
    const displayName = email.split("@")[0]?.slice(0, 40) || "Player";
    const [created] = await tx
      .insert(gamePlayers)
      .values({
        publicId: randomUUID(),
        siameseIssuer: identity.issuer,
        siameseSubject: identity.subject,
        displayName,
        email,
        avatarUrl: "",
        language,
        marketingConsent: false,
        termsAcceptedAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  });
}

export class SiameseAccountConflictError extends Error {
  constructor() {
    super("This member email already belongs to another game identity");
    this.name = "SiameseAccountConflictError";
  }
}
