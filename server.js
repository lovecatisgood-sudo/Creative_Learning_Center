// Production entry point for Hostinger Node.js Web Apps (and any Node host that
// expects a server file rather than a "next start" command). Runs the already-
// built Next.js app: SSR pages, API routes, middleware, and static assets are
// all served through Next's request handler. Listens on the host-assigned PORT.
//
// Deploy config on Hostinger:
//   Install command: corepack enable && pnpm install --frozen-lockfile
//   Build command:   pnpm hostinger:build
//   Entry file:      server.js      (or Start command: node server.js)
//   Node version:    22.x
const { createServer } = require("http");
const { createHash } = require("crypto");
const { readFileSync } = require("fs");
const path = require("path");
const next = require("next");
const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const { Pool } = require("pg");

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";
const app = next({ dev: false });
const handle = app.getRequestHandler();

function prepareRuntimeSecrets() {
  const memberSecret = process.env.MEMBER_SESSION_SECRET?.trim();
  if (memberSecret && memberSecret.length >= 32) return;

  const adminSecret = process.env.SESSION_SECRET?.trim();
  if (!adminSecret || adminSecret.length < 32) {
    throw new Error("MEMBER_SESSION_SECRET or a valid SESSION_SECRET is required before production can start");
  }

  // Domain separation produces a distinct cookie key without exposing or
  // directly reusing the admin-session password. An explicitly configured
  // MEMBER_SESSION_SECRET remains preferred and always wins.
  process.env.MEMBER_SESSION_SECRET = createHash("sha256")
    .update(`sccc-member-session:v1:${adminSecret}`)
    .digest("hex");
  console.warn("> MEMBER_SESSION_SECRET was absent; using a domain-separated key derived from SESSION_SECRET");
}

async function prepareDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before the production server can start");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: process.env.DATABASE_URL.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const client = await pool.connect();

  try {
    // Serialize startup migrations if the host briefly overlaps two releases.
    await client.query("select pg_advisory_lock($1)", [73194421]);
    const before = await client.query(
      "select (select count(*)::int from parents) as parents, (select count(*)::int from children) as children"
    );

    try {
      await migrate(drizzle(client), {
        migrationsFolder: path.join(process.cwd(), "drizzle"),
      });
    } catch (migrationError) {
      // Some existing Hostinger databases predate Drizzle's migration journal.
      // In that case replaying the full history stops on already-existing core
      // tables. Apply the member expansion independently; it is idempotent and
      // does not alter or delete established parent/child records.
      console.warn("> Full migration history could not be replayed; applying additive member schema bootstrap", migrationError);
      // Safe whether or not the migrator already rolled back; guarantees the
      // client is not left in PostgreSQL's aborted-transaction state.
      await client.query("rollback").catch(() => undefined);
      const bootstrapSql = readFileSync(
        path.join(process.cwd(), "drizzle", "member-schema-bootstrap.sql"),
        "utf8"
      );
      await client.query("begin");
      try {
        await client.query(bootstrapSql);
        await client.query("commit");
      } catch (bootstrapError) {
        await client.query("rollback").catch(() => undefined);
        throw bootstrapError;
      }
    }

    const requiredTables = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('parents', 'children', 'member_accounts', 'member_consents', 'member_uid_aliases', 'member_access_tokens')
    `);
    if (requiredTables.rowCount !== 6) {
      const found = requiredTables.rows.map((row) => row.table_name).sort().join(", ");
      throw new Error(`Production schema is incomplete after migration; found: ${found}`);
    }

    // Verify the exact columns used by runtime queries, not only table names.
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
    const beforeCounts = before.rows[0];
    const afterCounts = after.rows[0];
    if (
      beforeCounts.parents !== afterCounts.parents ||
      beforeCounts.children !== afterCounts.children
    ) {
      throw new Error(
        `Core customer counts changed during additive migration: parents ${beforeCounts.parents}->${afterCounts.parents}, children ${beforeCounts.children}->${afterCounts.children}`
      );
    }

    console.log(
      `> Database ready: ${afterCounts.parents} parents, ${afterCounts.children} children; member schema verified`
    );
    process.env.MEMBER_SCHEMA_READY = "1";
  } finally {
    await client.query("select pg_advisory_unlock($1)", [73194421]).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

prepareRuntimeSecrets();

prepareDatabase()
  .catch((error) => {
    process.env.MEMBER_SCHEMA_READY = "0";
    console.error("> Member schema readiness failed; starting core compatibility mode", error);
  })
  .then(() => app.prepare())
  .then(() => {
    const server = createServer((req, res) => handle(req, res));
    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });
    server.listen(port, host, () => {
      console.log(`> SCCC ready on http://${host}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
