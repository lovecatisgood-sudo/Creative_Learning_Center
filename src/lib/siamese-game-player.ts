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
      await linkGameProductProfile(tx, identity.subject, updated.id, game);
      return updated;
    }

    // Legacy Google players migrate only by the provider's immutable Google
    // subject. The value is read server-side from the provider identity table;
    // it is never added to OIDC claims or trusted from the browser.
    const googleIdentity = await tx.execute(sql<{ provider_subject: string }>`
      select provider_subject
      from member_auth_identities
      where member_subject = ${identity.subject}::uuid
        and provider = 'google' and status = 'active'
      limit 1
    `).catch(() => ({ rows: [] as Array<{ provider_subject: string }> }));
    const googleSubject = String(googleIdentity.rows[0]?.provider_subject ?? "");
    if (googleSubject) {
      const [legacy] = await tx.select().from(gamePlayers).where(eq(gamePlayers.googleSub, googleSubject)).limit(1);
      if (legacy) {
        if (legacy.siameseSubject && (legacy.siameseSubject !== identity.subject || legacy.siameseIssuer !== identity.issuer)) {
          throw new SiameseAccountConflictError();
        }
        const [updated] = await tx.update(gamePlayers).set({ siameseIssuer: identity.issuer, siameseSubject: identity.subject, email, language, updatedAt: now }).where(eq(gamePlayers.id, legacy.id)).returning();
        await linkGameProductProfile(tx, identity.subject, updated.id, game);
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
    await linkGameProductProfile(tx, identity.subject, created.id, game);
    return created;
  });
}

async function linkGameProductProfile(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  subject: string,
  playerId: number,
  game: SiameseGameAuthTarget,
) {
  const productId = game === "car-maze" ? "car-maze-production" : "cat-vs-dog-production";
  const reference = `game_player:${playerId}`;
  await tx.execute(sql`
    insert into member_product_profile_links
      (member_subject, product_id, profile_reference, linked_source)
    values (${subject}::uuid, ${productId}, ${reference}, 'game_oidc_callback')
    on conflict (member_subject, product_id) where status = 'active' do update
    set profile_reference = excluded.profile_reference,
        linked_source = excluded.linked_source,
        linked_at = now()
  `);
  await tx.execute(sql`
    update member_product_relationships
    set product_profile_reference = ${reference}, updated_at = now()
    where member_subject = ${subject}::uuid and product_id = ${productId}
  `);
}

export class SiameseAccountConflictError extends Error {
  constructor() {
    super("This member email already belongs to another game identity");
    this.name = "SiameseAccountConflictError";
  }
}
