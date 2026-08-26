import { randomUUID } from "node:crypto";
import type { SiameseCatIdentity } from "@siamesecat/member-auth";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { gamePlayers } from "@/db/schema";
import type { SiameseGameAuthTarget } from "@/lib/game-features";

export async function findOrCreateSiameseGamePlayer(identity: SiameseCatIdentity, language: "en" | "th", game: SiameseGameAuthTarget) {
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

    // Legacy Google players migrate only by the provider's immutable Google
    // subject. The value is read server-side from the provider identity table;
    // it is never added to OIDC claims or trusted from the browser.
    const identityTable = await tx.execute(sql<{ table_name: string | null }>`
      select to_regclass('public.member_auth_identities')::text as table_name
    `);
    const googleIdentity = identityTable.rows[0]?.table_name
      ? await tx.execute(sql<{ provider_subject: string }>`
          select provider_subject
          from member_auth_identities
          where member_subject = ${identity.subject}::uuid
            and provider = 'google' and status = 'active'
          limit 1
        `)
      : { rows: [] as Array<{ provider_subject: string }> };
    const googleSubject = String(googleIdentity.rows[0]?.provider_subject ?? "");
    if (googleSubject) {
      const [legacy] = await tx.select().from(gamePlayers).where(eq(gamePlayers.googleSub, googleSubject)).limit(1);
      if (legacy) {
        if (legacy.siameseSubject && (legacy.siameseSubject !== identity.subject || legacy.siameseIssuer !== identity.issuer)) {
          throw new SiameseAccountConflictError();
        }
        const [updated] = await tx.update(gamePlayers).set({ siameseIssuer: identity.issuer, siameseSubject: identity.subject, email, language, updatedAt: now }).where(eq(gamePlayers.id, legacy.id)).returning();
        return updated;
      }
    }

    // Email alone is never sufficient proof to attach a new OIDC subject.
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
