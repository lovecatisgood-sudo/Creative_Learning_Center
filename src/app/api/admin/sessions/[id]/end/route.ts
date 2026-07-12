import { NextResponse } from "next/server";
import { endSession, SessionError } from "@/lib/sessionOps";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let adminId: number;
  try {
    adminId = await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const sessionId = Number(params.id);
  if (!Number.isInteger(sessionId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const refundHours = body?.refundHours != null ? Number(body.refundHours) : undefined;

  try {
    const result = await endSession({ adminId, sessionId, refundHours });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof SessionError) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
}
