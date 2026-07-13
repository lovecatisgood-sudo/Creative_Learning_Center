import { NextResponse } from "next/server";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";
import { getDirectory } from "@/lib/directory";

export async function GET(req: Request) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const data = await getDirectory({ q, page });
  return NextResponse.json(data);
}
