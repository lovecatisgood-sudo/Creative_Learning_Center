import { NextResponse } from "next/server";
import { createPaidOrder, OrderError, type CartLine, type PaymentMethod } from "@/lib/orders";
import { readProofPhoto } from "@/lib/storage";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// Confirms a payment and creates the paid order in one transaction. Proof is
// server-enforced: the referenced photo key must resolve to a stored file
// (PRD §6.4, acceptance criterion "block confirmation until a proof photo").
export const runtime = "nodejs";

const METHODS: PaymentMethod[] = ["promptpay", "bank", "cash"];

export async function POST(req: Request) {
  let adminId: number;
  try {
    adminId = await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => null);
  const childId = Number(body?.childId);
  const method = body?.method as PaymentMethod;
  const proofKey = String(body?.proofKey ?? "");
  const items: CartLine[] = Array.isArray(body?.items)
    ? body.items.map((i: { sku: unknown; qty: unknown }) => ({ sku: String(i.sku), qty: Number(i.qty) }))
    : [];

  if (!Number.isInteger(childId)) return NextResponse.json({ error: "Bad childId" }, { status: 422 });
  if (!METHODS.includes(method)) return NextResponse.json({ error: "Bad method" }, { status: 422 });
  if (items.length === 0) return NextResponse.json({ error: "Empty cart" }, { status: 422 });

  // Server-enforced proof: the key must reference a real stored photo.
  if (!proofKey) return NextResponse.json({ error: "Proof photo required" }, { status: 422 });
  try {
    await readProofPhoto(proofKey);
  } catch {
    return NextResponse.json({ error: "Proof photo missing or invalid" }, { status: 422 });
  }

  try {
    const result = await createPaidOrder({
      adminId,
      childId,
      lines: items,
      method,
      proofPhotoPath: proofKey,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
}
