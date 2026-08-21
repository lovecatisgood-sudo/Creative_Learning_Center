import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getSiameseGameLoginConfig } from "@/lib/game-features";
import { ensureMemberSchemaReady } from "@/lib/member-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RELEASE = "2026-08-21-car-maze-siamese-auth";

export async function GET() {
  let coreDatabaseReady = true;
  try {
    await db.execute(sql`select p.id, c.id from parents p left join children c on false limit 0`);
  } catch {
    coreDatabaseReady = false;
  }

  const memberSchemaReady = await ensureMemberSchemaReady();
  let siameseGameSchemaReady = true;
  try {
    await db.execute(sql`select gp.siamese_issuer, gp.siamese_subject from game_players gp limit 0`);
    const indexResult = await db.execute(sql`
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'game_players'
        and indexname = 'game_players_siamese_identity_unique'
    `);
    siameseGameSchemaReady = indexResult.rows.length === 1;
  } catch {
    siameseGameSchemaReady = false;
  }
  let siameseGameAuthReady = false;
  try {
    siameseGameAuthReady = siameseGameSchemaReady && getSiameseGameLoginConfig("car-maze").enabled;
  } catch {
    siameseGameAuthReady = false;
  }
  const startupGuardRan = process.env.MEMBER_SCHEMA_READY === "0" || process.env.MEMBER_SCHEMA_READY === "1";
  const siameseGameStartupGuardRan = process.env.SIAMESE_GAME_SCHEMA_READY === "0" || process.env.SIAMESE_GAME_SCHEMA_READY === "1";
  const status = coreDatabaseReady && memberSchemaReady ? 200 : 503;

  return NextResponse.json({
    release: RELEASE,
    coreDatabaseReady,
    memberSchemaReady,
    startupGuardRan,
    siameseGameSchemaReady,
    siameseGameAuthReady,
    siameseGameStartupGuardRan,
    schemaErrorCode: process.env.MEMBER_SCHEMA_ERROR_CODE || null,
    siameseGameSchemaErrorCode: process.env.SIAMESE_GAME_SCHEMA_ERROR_CODE || null,
  }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
