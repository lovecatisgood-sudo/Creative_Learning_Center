import { NextResponse } from "next/server";
import { startSession, SessionError } from "@/lib/sessionOps";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

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
  if (!Number.isInteger(packageInstanceId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: "Bad request" }, { status: 422 });
  }
  if (body?.hours != null && !Number.isFinite(Number(body.hours))) {
    return NextResponse.json({ error: "Bad hours" }, { status: 422 });
  }
  const hours = body?.hours != null ? Number(body.hours) : undefined;

  try {
    const result = await startSession({ adminId, packageInstanceId, childId, hours });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof SessionError) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
}
