import { NextResponse } from "next/server";
import { getRunningSessions } from "@/lib/sessions";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// Running-sessions feed for the dashboard's 30s poll (A1 / PRD §6.8).
export async function GET() {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
  const sessions = await getRunningSessions();
  return NextResponse.json({ sessions, now: new Date().toISOString() });
}
