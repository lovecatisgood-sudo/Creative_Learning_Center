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

    await migrate(drizzle(client), {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });

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
  } finally {
    await client.query("select pg_advisory_unlock($1)", [73194421]).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

prepareRuntimeSecrets();

prepareDatabase()
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
