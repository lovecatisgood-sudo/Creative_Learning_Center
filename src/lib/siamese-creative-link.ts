import type { SiameseCatIdentity } from "@siamesecat/member-auth";
import { Pool } from "pg";

export class CreativeIdentityConflictError extends Error {
  constructor(message = "This Siamese identity conflicts with an existing Creative profile link") {
    super(message);
    this.name = "CreativeIdentityConflictError";
  }
}

export async function recordCreativeLinkAttempt(memberAccountId: number, correlationId: string): Promise<void> {
  await attemptQuery(
    `insert into creative_member_link_attempts (member_account_id, status, correlation_id)
     values ($1, 'pending', $2)
     on conflict (correlation_id) do nothing`,
    [memberAccountId, correlationId],
  );
}

export async function failCreativeLinkAttempt(correlationId: string, errorCode: string): Promise<void> {
  await attemptQuery(
    `update creative_member_link_attempts set status = 'failed', error_code = $2, updated_at = now()
     where correlation_id = $1 and status = 'pending'`,
    [correlationId, errorCode.slice(0, 60)],
  );
}

export async function linkCreativeMemberProfile(input: {
  memberAccountId: number;
  identity: SiameseCatIdentity;
  correlationId: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: process.env.DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [`creative-link:${input.memberAccountId}`]);
    const account = await client.query<{ id: number; email_normalized: string | null; email_verified_at: Date | null }>(
      "select id, email_normalized, email_verified_at from member_accounts where id = $1 for update",
      [input.memberAccountId],
    );
    if (!account.rows[0]) throw new Error("Creative member account not found");
    const existing = await client.query<{ member_account_id: number; issuer: string; subject: string }>(
      `select member_account_id, issuer, subject from creative_member_identity_links
       where member_account_id = $1 or (issuer = $2 and subject = $3)
       for update`,
      [input.memberAccountId, input.identity.issuer, input.identity.subject],
    );
    if (existing.rows.some((row) => row.member_account_id !== input.memberAccountId || row.issuer !== input.identity.issuer || row.subject !== input.identity.subject)) {
      throw new CreativeIdentityConflictError();
    }
    const email = input.identity.email.trim().toLowerCase();
    const current = account.rows[0];
    if (current.email_verified_at && current.email_normalized && current.email_normalized !== email) {
      throw new CreativeIdentityConflictError("Verified Creative and Siamese emails do not match; manual review is required");
    }
    const emailOwner = await client.query<{ id: number }>(
      "select id from member_accounts where email_normalized = $1 and id <> $2 limit 1",
      [email, input.memberAccountId],
    );
    if (emailOwner.rowCount) throw new CreativeIdentityConflictError("Verified email already belongs to another Creative profile");

    await client.query(
      `insert into creative_member_identity_links
        (member_account_id, issuer, subject, verified_email, linked_source)
       values ($1, $2, $3, $4, 'oidc_signup_or_link_later')
       on conflict (member_account_id) do update
       set verified_email = excluded.verified_email, status = 'active', updated_at = now()`,
      [input.memberAccountId, input.identity.issuer, input.identity.subject, email],
    );
    await client.query(
      "update member_accounts set email_normalized = $2, email_verified_at = now(), updated_at = now() where id = $1",
      [input.memberAccountId, email],
    );
    await client.query(
      `insert into member_product_profile_links
        (member_subject, product_id, profile_reference, linked_source)
       values ($1::uuid, 'creative-club-production', $2, 'creative_oidc_callback')
       on conflict (member_subject, product_id) where status = 'active' do update
       set profile_reference = excluded.profile_reference,
           linked_source = excluded.linked_source,
           linked_at = now()`,
      [input.identity.subject, `member_account:${input.memberAccountId}`],
    );
    await client.query(
      `update member_product_relationships
       set product_profile_reference = $2, updated_at = now()
       where member_subject = $1::uuid and product_id = 'creative-club-production'`,
      [input.identity.subject, `member_account:${input.memberAccountId}`],
    );
    await client.query(
      `update creative_member_link_attempts
       set status = 'linked', error_code = null, updated_at = now()
       where correlation_id = $1`,
      [input.correlationId],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function attemptQuery(text: string, values: unknown[]): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: process.env.DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
  try { await pool.query(text, values); } finally { await pool.end(); }
}
