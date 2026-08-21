import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getSiameseGameLoginConfig } from "@/lib/game-features";
import { ensureMemberSchemaReady } from "@/lib/member-schema";
import { ensureSiameseGameSchemaReady } from "@/lib/siamese-game-schema";

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
  const siameseGameSchemaReady = await ensureSiameseGameSchemaReady();
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
