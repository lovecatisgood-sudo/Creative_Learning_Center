import { NextResponse } from "next/server";
import { saveProofPhoto } from "@/lib/storage";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// Stores a (client-compressed) payment-proof photo and returns its opaque key.
// The key is later attached to the payment at order confirmation.
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file" }, { status: 422 });
  }
  // Guard against oversized uploads (client compresses to ~500KB; allow 8MB headroom).
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const type = file.type || "image/jpeg";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const bytes = Buffer.from(await file.arrayBuffer());
  const key = await saveProofPhoto(bytes, ext);
  return NextResponse.json({ key });
}
