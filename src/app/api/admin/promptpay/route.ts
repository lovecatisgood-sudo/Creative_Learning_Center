import { NextResponse } from "next/server";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// Renders a PromptPay EMVCo QR PNG with the exact amount embedded (PRD §2). The
// PromptPay ID is server-only env, so the QR must be generated server-side.
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const id = process.env.PROMPTPAY_ID;
  if (!id) return NextResponse.json({ error: "PROMPTPAY_ID not configured" }, { status: 503 });

  const amount = Number(new URL(req.url).searchParams.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Bad amount" }, { status: 400 });
  }

  const payload = generatePayload(id, { amount });
  const png = await QRCode.toBuffer(payload, { type: "png", width: 512, margin: 1 });
  return new NextResponse(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
