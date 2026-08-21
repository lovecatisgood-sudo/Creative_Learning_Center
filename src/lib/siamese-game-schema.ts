import { Pool } from "pg";

const SIAMESE_GAME_SCHEMA_LOCK = 73194422;

const globalSiameseGameSchema = globalThis as unknown as {
  readinessPromise?: Promise<boolean>;
};

export function isSiameseGameSchemaReady(): boolean {
  return process.env.SIAMESE_GAME_SCHEMA_READY === "1";
}

export async function ensureSiameseGameSchemaReady(): Promise<boolean> {
  if (isSiameseGameSchemaReady()) return true;
  if (globalSiameseGameSchema.readinessPromise) return globalSiameseGameSchema.readinessPromise;

  globalSiameseGameSchema.readinessPromise = prepareSiameseGameSchema().finally(() => {
    if (!isSiameseGameSchemaReady()) globalSiameseGameSchema.readinessPromise = undefined;
  });
  return globalSiameseGameSchema.readinessPromise;
}

async function prepareSiameseGameSchema(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    process.env.SIAMESE_GAME_SCHEMA_READY = "0";
    process.env.SIAMESE_GAME_SCHEMA_ERROR_CODE = "DATABASE_URL_MISSING";
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
    process.env.SIAMESE_GAME_SCHEMA_READY = "0";
    process.env.SIAMESE_GAME_SCHEMA_ERROR_CODE = String(error?.code || error?.name || "CONNECT_FAILED").slice(0, 40);
    return null;
  });
  if (!client) {
    await pool.end().catch(() => undefined);
    return false;
  }

  try {
    await client.query("select pg_advisory_lock($1)", [SIAMESE_GAME_SCHEMA_LOCK]);
    const before = await client.query(
      "select (select count(*)::int from parents) as parents, (select count(*)::int from children) as children",
    );
    await client.query("begin");
    try {
      await client.query('alter table "game_players" add column if not exists "siamese_issuer" text');
      await client.query('alter table "game_players" add column if not exists "siamese_subject" text');
      await client.query(
        'create unique index if not exists "game_players_siamese_identity_unique" on "game_players" ("siamese_issuer", "siamese_subject")',
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    }

    await client.query("select gp.siamese_issuer, gp.siamese_subject from game_players gp limit 0");
    const index = await client.query(`
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'game_players'
        and indexname = 'game_players_siamese_identity_unique'
    `);
    if (index.rowCount !== 1) throw new Error("SIAMESE_GAME_IDENTITY_INDEX_MISSING");

    const after = await client.query(
      "select (select count(*)::int from parents) as parents, (select count(*)::int from children) as children",
    );
    if (
      before.rows[0].parents !== after.rows[0].parents
      || before.rows[0].children !== after.rows[0].children
    ) {
      throw new Error("CORE_CUSTOMER_COUNTS_CHANGED");
    }

    process.env.SIAMESE_GAME_SCHEMA_READY = "1";
    delete process.env.SIAMESE_GAME_SCHEMA_ERROR_CODE;
    console.log("> Runtime Siamese game identity schema verified");
    return true;
  } catch (error: any) {
    process.env.SIAMESE_GAME_SCHEMA_READY = "0";
    process.env.SIAMESE_GAME_SCHEMA_ERROR_CODE = String(error?.code || error?.message || error?.name || "unknown").slice(0, 40);
    console.error("> Runtime Siamese game identity schema readiness failed", error);
    return false;
  } finally {
    await client.query("select pg_advisory_unlock($1)", [SIAMESE_GAME_SCHEMA_LOCK]).catch(() => undefined);
    client.release();
    await pool.end().catch(() => undefined);
  }
}
