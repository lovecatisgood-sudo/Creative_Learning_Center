import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const LOCK = 73_194_510;
const state = globalThis as unknown as { siameseLinkReady?: Promise<boolean> };

export async function ensureSiameseMemberLinkSchema(): Promise<boolean> {
  state.siameseLinkReady ??= prepare().finally(() => {
    if (process.env.SIAMESE_LINK_SCHEMA_READY !== "1") state.siameseLinkReady = undefined;
  });
  return state.siameseLinkReady;
}

async function prepare(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return failed("DATABASE_URL_MISSING");
  let failureCode = "LINK_SCHEMA_PREPARATION_FAILED";
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: process.env.DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect().catch(() => null);
  if (!client) { await pool.end().catch(() => undefined); return failed("CONNECT_FAILED"); }
  try {
    await client.query("select pg_advisory_lock($1)", [LOCK]);
    const before = await client.query("select (select count(*)::text from parents) parents, (select count(*)::text from children) children");
    failureCode = "LINK_SCHEMA_BOOTSTRAP_READ_FAILED";
    const sql = await readFile(path.join(process.cwd(), "drizzle/siamese-link-schema-bootstrap.sql"), "utf8");
    failureCode = "LINK_SCHEMA_PREPARATION_FAILED";
    await client.query("begin");
    try { await client.query(sql); await client.query("commit"); } catch (error) { await client.query("rollback"); throw error; }
    await client.query("select member_account_id, issuer, subject, status from creative_member_identity_links limit 0");
    await client.query("select member_account_id, status, correlation_id from creative_member_link_attempts limit 0");
    const after = await client.query("select (select count(*)::text from parents) parents, (select count(*)::text from children) children");
    if (JSON.stringify(before.rows[0]) !== JSON.stringify(after.rows[0])) throw new Error("CORE_CUSTOMER_COUNTS_CHANGED");
    process.env.SIAMESE_LINK_SCHEMA_READY = "1";
    delete process.env.SIAMESE_LINK_SCHEMA_ERROR_CODE;
    return true;
  } catch {
    console.error("Siamese member link schema readiness failed", { code: failureCode });
    return failed(failureCode);
  } finally {
    await client.query("select pg_advisory_unlock($1)", [LOCK]).catch(() => undefined);
    client.release();
    await pool.end().catch(() => undefined);
  }
}

function failed(code: string): false {
  process.env.SIAMESE_LINK_SCHEMA_READY = "0";
  process.env.SIAMESE_LINK_SCHEMA_ERROR_CODE = code.slice(0, 40);
  return false;
}
