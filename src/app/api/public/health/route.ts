import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { withPrivateAuthHeaders } from "@/lib/auth-response";
import { getSiameseGameLoginConfig } from "@/lib/game-features";
import { ensureMemberSchemaReady } from "@/lib/member-schema";
import { getSiameseCreativeAuthConfig } from "@/lib/siamese-creative-auth";
import { ensureSiameseGameSchemaReady } from "@/lib/siamese-game-schema";
import { ensureSiameseMemberLinkSchema } from "@/lib/siamese-member-link-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RELEASE = "2026-08-26-auth-reliability";

export async function GET() {
  let coreDatabaseReady = true;
  try {
    await db.execute(sql`select p.id, c.id from parents p left join children c on false limit 0`);
  } catch {
    coreDatabaseReady = false;
  }

  const memberSchemaReady = await ensureMemberSchemaReady();
  const siameseGameSchemaReady = await ensureSiameseGameSchemaReady();
  const siameseCreativeAuthRequested = String(process.env.SIAMESE_CREATIVE_AUTH_ENABLED ?? "").trim().toLowerCase() === "true";
  let siameseCreativeAuthConfigured = false;
  let siameseCreativeLinkSchemaReady = process.env.SIAMESE_LINK_SCHEMA_READY === "1";
  try {
    siameseCreativeAuthConfigured = getSiameseCreativeAuthConfig().enabled;
    if (siameseCreativeAuthConfigured) {
      siameseCreativeLinkSchemaReady = await ensureSiameseMemberLinkSchema();
    }
  } catch {
    siameseCreativeAuthConfigured = false;
  }
  const siameseCreativeAuthReady = siameseCreativeAuthConfigured && siameseCreativeLinkSchemaReady;
  let siameseGameAuthReady = false;
  try {
    siameseGameAuthReady = siameseGameSchemaReady && getSiameseGameLoginConfig("car-maze").enabled;
  } catch {
    siameseGameAuthReady = false;
  }
  const startupGuardRan = process.env.MEMBER_SCHEMA_READY === "0" || process.env.MEMBER_SCHEMA_READY === "1";
  const siameseGameStartupGuardRan = process.env.SIAMESE_GAME_SCHEMA_READY === "0" || process.env.SIAMESE_GAME_SCHEMA_READY === "1";
  const status = coreDatabaseReady && memberSchemaReady ? 200 : 503;

  return withPrivateAuthHeaders(NextResponse.json({
    release: RELEASE,
    coreDatabaseReady,
    memberSchemaReady,
    startupGuardRan,
    siameseGameSchemaReady,
    siameseGameAuthReady,
    siameseGameStartupGuardRan,
    siameseCreativeAuthRequested,
    siameseCreativeAuthConfigured,
    siameseCreativeLinkSchemaReady,
    siameseCreativeAuthReady,
    siameseCreativeStartupGuardRan: process.env.SIAMESE_LINK_SCHEMA_READY === "0" || process.env.SIAMESE_LINK_SCHEMA_READY === "1",
    schemaErrorCode: process.env.MEMBER_SCHEMA_ERROR_CODE || null,
    siameseGameSchemaErrorCode: process.env.SIAMESE_GAME_SCHEMA_ERROR_CODE || null,
    siameseCreativeSchemaErrorCode: process.env.SIAMESE_LINK_SCHEMA_ERROR_CODE || null,
  }, {
    status,
  }), false);
}
