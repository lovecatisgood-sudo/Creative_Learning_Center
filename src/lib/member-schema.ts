import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const MEMBER_SCHEMA_LOCK = 73194421;

const globalMemberSchema = globalThis as unknown as {
  readinessPromise?: Promise<boolean>;
};

export function isMemberSchemaReady(): boolean {
  return process.env.MEMBER_SCHEMA_READY === "1";
}

export async function ensureMemberSchemaReady(): Promise<boolean> {
  if (isMemberSchemaReady()) return true;
  if (globalMemberSchema.readinessPromise) return globalMemberSchema.readinessPromise;

  globalMemberSchema.readinessPromise = prepareMemberSchema().finally(() => {
    // Preserve successful readiness forever in this process. Permit a later
    // request to retry a transient connection or deployment error.
    if (!isMemberSchemaReady()) globalMemberSchema.readinessPromise = undefined;
  });
  return globalMemberSchema.readinessPromise;
}

async function prepareMemberSchema(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    process.env.MEMBER_SCHEMA_READY = "0";
    process.env.MEMBER_SCHEMA_ERROR_CODE = "DATABASE_URL_MISSING";
    return false;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: process.env.DATABASE_URL.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const client = await pool.connect().catch((error) => {
    process.env.MEMBER_SCHEMA_READY = "0";
    process.env.MEMBER_SCHEMA_ERROR_CODE = String(error?.code || error?.name || "CONNECT_FAILED").slice(0, 40);
    return null;
  });
  if (!client) {
    await pool.end().catch(() => undefined);
    return false;
  }

  try {
    await client.query("select pg_advisory_lock($1)", [MEMBER_SCHEMA_LOCK]);
    const before = await client.query(
      "select (select count(*)::int from parents) as parents, (select count(*)::int from children) as children"
    );
    const bootstrapSql = await readFile(
      path.join(process.cwd(), "drizzle", "member-schema-bootstrap.sql"),
      "utf8"
    );

    await client.query("begin");
    try {
      await client.query(bootstrapSql);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    }

    await client.query(`
      select
        ma.parent_id, ma.public_uid, ma.phone_normalized, ma.email_normalized,
        ma.email_verified_at, ma.preferred_language, ma.session_version,
        mc.member_account_id, mc.policy_version,
        mua.public_uid as alias_uid,
        mat.token_hash, mat.expires_at
      from member_accounts ma
      left join member_consents mc on false
      left join member_uid_aliases mua on false
      left join member_access_tokens mat on false
      limit 0
    `);
    const after = await client.query(
      "select (select count(*)::int from parents) as parents, (select count(*)::int from children) as children"
    );
    if (
      before.rows[0].parents !== after.rows[0].parents ||
      before.rows[0].children !== after.rows[0].children
    ) {
      throw new Error("CORE_CUSTOMER_COUNTS_CHANGED");
    }

    process.env.MEMBER_SCHEMA_READY = "1";
    delete process.env.MEMBER_SCHEMA_ERROR_CODE;
    console.log("> Runtime member schema verified");
    return true;
  } catch (error: any) {
    process.env.MEMBER_SCHEMA_READY = "0";
    process.env.MEMBER_SCHEMA_ERROR_CODE = String(error?.code || error?.message || error?.name || "unknown").slice(0, 40);
    console.error("> Runtime member schema readiness failed", error);
    return false;
  } finally {
    await client.query("select pg_advisory_unlock($1)", [MEMBER_SCHEMA_LOCK]).catch(() => undefined);
    client.release();
    await pool.end().catch(() => undefined);
  }
}
