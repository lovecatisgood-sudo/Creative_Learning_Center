import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { isMemberSchemaReady } from "@/lib/member-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RELEASE = "2026-08-17-startup-guard";

export async function GET() {
  let coreDatabaseReady = true;
  try {
    await db.execute(sql`select p.id, c.id from parents p left join children c on false limit 0`);
  } catch {
    coreDatabaseReady = false;
  }

  const memberSchemaReady = isMemberSchemaReady();
  const startupGuardRan = process.env.MEMBER_SCHEMA_READY === "0" || process.env.MEMBER_SCHEMA_READY === "1";
  const status = coreDatabaseReady && memberSchemaReady ? 200 : 503;

  return NextResponse.json({
    release: RELEASE,
    coreDatabaseReady,
    memberSchemaReady,
    startupGuardRan,
    schemaErrorCode: process.env.MEMBER_SCHEMA_ERROR_CODE || null,
  }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
