import { NextResponse } from "next/server";
import { redeemCredit, SessionError } from "@/lib/sessionOps";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// Consume a crayon / clay / extra_hour credit (A10 / PRD §6.7). extra_hour is
// hard-blocked without a running session; crayon/clay are soft (caller decides).
export async function POST(req: Request) {
  let adminId: number;
  try {
    adminId = await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const packageInstanceId = Number(body?.packageInstanceId);
  const childId = Number(body?.childId);
  const type = body?.type;
  if (!Number.isInteger(packageInstanceId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: "Bad request" }, { status: 422 });
  }
  if (type !== "crayon" && type !== "clay" && type !== "extra_hour") {
    return NextResponse.json({ error: "Bad type" }, { status: 422 });
  }
  if (body?.sessionId != null && !Number.isInteger(Number(body.sessionId))) {
    return NextResponse.json({ error: "Bad sessionId" }, { status: 422 });
  }
  const sessionId = body?.sessionId != null ? Number(body.sessionId) : null;

  try {
    const result = await redeemCredit({ adminId, packageInstanceId, childId, type, sessionId });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof SessionError) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
}
