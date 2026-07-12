import { NextResponse } from "next/server";
import { readProofPhoto } from "@/lib/storage";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// Serves a stored proof photo to authenticated admins only (photos live outside
// the public folder).
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  try {
    const { bytes, contentType } = await readProofPhoto(params.key);
    return new NextResponse(bytes as unknown as BodyInit, {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
