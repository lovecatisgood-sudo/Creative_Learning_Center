import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import {
  CreativeIdentityConflictError,
  linkCreativeMemberProfile,
  recordCreativeLinkAttempt,
} from "../src/lib/siamese-creative-link";

const baseUrl = process.env.TEST_DATABASE_URL;
if (!baseUrl || process.env.MEMBER_TEST_DATABASE !== "1" || !new URL(baseUrl).pathname.toLowerCase().includes("test")) {
  throw new Error("Refusing to run Creative link checks outside an explicitly marked test database");
}

const databaseName = `creative_link_test_${randomUUID().replaceAll("-", "")}`;
const admin = new Pool({ connectionString: baseUrl });
const testUrl = new URL(baseUrl);
testUrl.pathname = `/${databaseName}`;
let pool: Pool | undefined;

async function main(): Promise<void> {
try {
  await admin.query(`create database ${databaseName}`);
  pool = new Pool({ connectionString: testUrl.toString(), max: 2 });
  await applyCreativeMigrations(pool);
  await seedBusinessHistory(pool);
  const beforeMigrations = await counts(pool);
  await applyProviderMigrations(pool);
  await applyProviderMigration(pool, "0004_universal_membership.sql");
  await pool.query(await readFile(path.join(process.cwd(), "drizzle/0010_creative_member_identity_links.sql"), "utf8"));
  const afterMigrations = await counts(pool);
  assert.deepEqual(afterMigrations, beforeMigrations, "additive migrations must preserve every core business and game row");

  const linked = await pool.query<{ member_id: number; subject: string }>(
    `select members.id as member_id, accounts.subject::text
     from member_accounts members
     join siamese_oidc_accounts accounts on accounts.member_account_id = members.id
     where members.email_normalized = 'link-me@example.com'`,
  );
  const memberId = linked.rows[0]?.member_id;
  const subject = linked.rows[0]?.subject;
  assert.ok(memberId && subject);
  await pool.query(
    `insert into member_product_relationships
      (member_subject, product_id, first_authenticated_at, last_authenticated_at,
       successful_login_count, first_source, last_auth_method)
     values ($1::uuid, 'creative-club-production', now(), now(), 1, 'creative-link-test', 'email')`,
    [subject],
  );
  const identity = { issuer: "https://members.test", subject, email: "link-me@example.com", emailVerified: true };

  process.env.DATABASE_URL = testUrl.toString();
  const correlationId = randomUUID();
  await recordCreativeLinkAttempt(memberId, correlationId);
  await linkCreativeMemberProfile({ memberAccountId: memberId, identity, correlationId });
  await linkCreativeMemberProfile({ memberAccountId: memberId, identity, correlationId });

  const linkState = await pool.query<{
    links: string;
    attempts: string;
    provider_links: string;
    relationship_reference: string | null;
  }>(
    `select
       (select count(*)::text from creative_member_identity_links where member_account_id = $1) as links,
       (select count(*)::text from creative_member_link_attempts where member_account_id = $1 and status = 'linked') as attempts,
       (select count(*)::text from member_product_profile_links where member_subject = $2::uuid and product_id = 'creative-club-production' and status = 'active') as provider_links,
       (select product_profile_reference from member_product_relationships where member_subject = $2::uuid and product_id = 'creative-club-production') as relationship_reference`,
    [memberId, subject],
  );
  assert.deepEqual(linkState.rows[0], {
    links: "1",
    attempts: "1",
    provider_links: "0",
    relationship_reference: null,
  });
  assert.deepEqual(await counts(pool), beforeMigrations, "link-later must not duplicate or reassign existing history");

  await pool.query("update game_players set google_sub = 'legacy-google-link-test' where public_id = 'PLAYER-LINK-TEST'");
  await pool.query(
    `insert into member_auth_identities
      (member_subject, provider, provider_subject, verified_email)
     values ($1::uuid, 'google', 'legacy-google-link-test', 'link-me@example.com')`,
    [subject],
  );
  await pool.query(
    `insert into member_product_relationships
      (member_subject, product_id, first_authenticated_at, last_authenticated_at,
       successful_login_count, first_source, last_auth_method)
     values
      ($1::uuid, 'cat-vs-dog-production', now(), now(), 1, 'game-link-test', 'google'),
      ($1::uuid, 'car-maze-production', now(), now(), 1, 'game-link-test', 'google')`,
    [subject],
  );
  const { findOrCreateSiameseGamePlayer } = await import("../src/lib/siamese-game-player");
  const migratedPlayer = await findOrCreateSiameseGamePlayer(identity, "en", "cat-vs-dog");
  const carMazePlayer = await findOrCreateSiameseGamePlayer(identity, "en", "car-maze");
  assert.equal(migratedPlayer.id, carMazePlayer.id);
  const gameState = await pool.query<{ players: string; runs: string; links: string; subjects: string }>(
    `select
       (select count(*)::text from game_players) as players,
       (select count(*)::text from game_runs) as runs,
       (select count(*)::text from member_product_profile_links where member_subject = $1::uuid and product_id in ('cat-vs-dog-production', 'car-maze-production') and status = 'active') as links,
       (select count(*)::text from game_players where siamese_subject = $1::text and siamese_issuer = 'https://members.test') as subjects`,
    [subject],
  );
  assert.deepEqual(gameState.rows[0], { players: "1", runs: "1", links: "0", subjects: "1" });
  assert.deepEqual(await counts(pool), beforeMigrations, "game identity migration must retain the existing player and run");

  const conflict = await pool.query<{ id: number }>(
    `with parent as (
       insert into parents (name, phone, email) values ('Conflict Parent', '0899999999', 'creative-conflict@example.com') returning id
     )
     insert into member_accounts
       (parent_id, public_uid, phone_normalized, email_normalized, email_verified_at, preferred_language)
     select id, 'SCCC-CONFLICT-TEST', '+66899999999', 'creative-conflict@example.com', now(), 'en' from parent
     returning id`,
  );
  const conflictId = randomUUID();
  await recordCreativeLinkAttempt(conflict.rows[0]!.id, conflictId);
  await assert.rejects(
    linkCreativeMemberProfile({ memberAccountId: conflict.rows[0]!.id, identity, correlationId: conflictId }),
    CreativeIdentityConflictError,
  );
  const conflictState = await pool.query<{ links: string; verified_email: string }>(
    `select
       (select count(*)::text from creative_member_identity_links where member_account_id = $1) as links,
       (select email_normalized from member_accounts where id = $1) as verified_email`,
    [conflict.rows[0]!.id],
  );
  assert.deepEqual(conflictState.rows[0], { links: "0", verified_email: "creative-conflict@example.com" });

  const originalCwd = process.cwd();
  delete process.env.SIAMESE_LINK_SCHEMA_READY;
  const { ensureSiameseMemberLinkSchema } = await import("../src/lib/siamese-member-link-schema");
  process.chdir("/tmp");
  const optionalReady = await ensureSiameseMemberLinkSchema();
  process.chdir(originalCwd);
  assert.equal(optionalReady, false, "an optional membership-schema preparation error must be explicit");
  const core = await pool.connect();
  try {
    await core.query("begin");
    const registration = await core.query<{ parent_id: number; child_id: number }>(
      `with parent as (
         insert into parents (name, phone, email) values ('Fallback Parent', '0877777777', null) returning id
       ), child as (
         insert into children (parent_id, name, dob, gender)
         select id, 'Fallback Child', '2021-01-01', 'male' from parent returning id, parent_id
       ) select parent_id, id as child_id from child`,
    );
    assert.ok(registration.rows[0]?.parent_id && registration.rows[0]?.child_id, "core registration must remain writable when optional linking fails");
    await core.query("rollback");
  } finally {
    await core.query("rollback").catch(() => undefined);
    core.release();
  }

  console.log("siamese-creative-link → migrations, optional-failure isolation, preservation, link-later, game migration, and conflict checks passed");
} finally {
  delete process.env.DATABASE_URL;
  await (globalThis as unknown as { pool?: Pool }).pool?.end().catch(() => undefined);
  await pool?.end().catch(() => undefined);
  await admin.query(`drop database if exists ${databaseName} with (force)`).catch(() => undefined);
  await admin.end();
}
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function applyCreativeMigrations(database: Pool): Promise<void> {
  const directory = path.join(process.cwd(), "drizzle");
  const files = (await readdir(directory)).filter((file) => /^\d{4}.*\.sql$/.test(file)).sort();
  for (const file of files) await database.query(await readFile(path.join(directory, file), "utf8"));
}

async function applyProviderMigrations(database: Pool): Promise<void> {
  await applyProviderMigration(database, "0001_identity_provider.sql");
  await database.query(
    `insert into siamese_oidc_subjects (member_account_id, subject)
     select id, gen_random_uuid() from member_accounts
     where email_normalized is not null and email_verified_at is not null
     on conflict (member_account_id) do nothing`,
  );
  await applyProviderMigration(database, "0003_identity_signup.sql");
  await applyProviderMigration(database, "0004_universal_membership.sql");
}

async function applyProviderMigration(database: Pool, file: string): Promise<void> {
  const providerRoot = path.resolve(process.cwd(), "../Login_with_Siamese_member_Oauth");
  await database.query(await readFile(path.join(providerRoot, "migrations", file), "utf8"));
}

async function seedBusinessHistory(database: Pool): Promise<void> {
  await database.query(
    `with parent as (
       insert into parents (name, phone, email) values ('Link Parent', '0812345678', 'link-me@example.com') returning id
     ), member as (
       insert into member_accounts
         (parent_id, public_uid, phone_normalized, email_normalized, email_verified_at, preferred_language)
       select id, 'SCCC-LINK-TEST-01', '+66812345678', 'link-me@example.com', now(), 'en' from parent returning id, parent_id
     ), child as (
       insert into children (parent_id, name, dob, gender) select parent_id, 'Existing Child', '2020-01-01', 'female' from member returning id, parent_id
     ), product as (
       insert into products (sku, name_en, name_th, type, price_thb, grants)
       values ('LINK_TEST_PASS', 'Link test pass', 'แพ็กเกจทดสอบ', 'HOUR_PASS', 500, '{"hours":5}') returning id
     ), ordered as (
       insert into orders (parent_id, child_id, status, total_thb, receipt_no)
       select child.parent_id, child.id, 'paid', 500, 'LINK-TEST-RECEIPT' from child returning id, child_id
     ), item as (
       insert into order_items (order_id, product_id, qty, unit_price_thb, line_total_thb)
       select ordered.id, product.id, 1, 500, 500 from ordered cross join product returning id, product_id
     ), package as (
       insert into package_instances (order_item_id, product_id, owner_child_id, status, hours_total, hours_remaining)
       select item.id, item.product_id, ordered.child_id, 'active', 5, 3 from item cross join ordered returning id, owner_child_id
     )
     insert into sessions (package_instance_id, child_id, hours_booked, planned_end_at, status)
     select package.id, package.owner_child_id, 1, now() + interval '1 hour', 'running' from package;

     with player as (
       insert into game_players
         (public_id, display_name, email, language, marketing_consent, terms_accepted_at)
       values ('PLAYER-LINK-TEST', 'Existing Player', 'player@example.com', 'en', false, now()) returning id
     )
     insert into game_runs (player_id, score, mode, stage, victory, language, duration_seconds)
     select id, 123, 'cat-vs-dog', 8, true, 'en', 90 from player`,
  );
}

async function counts(database: Pool): Promise<Record<string, string>> {
  const result = await database.query<Record<string, string>>(
    `select
       (select count(*)::text from parents) as parents,
       (select count(*)::text from children) as children,
       (select count(*)::text from member_accounts) as members,
       (select count(*)::text from orders) as orders,
       (select count(*)::text from order_items) as order_items,
       (select count(*)::text from package_instances) as packages,
       (select count(*)::text from sessions) as sessions,
       (select count(*)::text from game_players) as game_players,
       (select count(*)::text from game_runs) as game_runs`,
  );
  return result.rows[0]!;
}
