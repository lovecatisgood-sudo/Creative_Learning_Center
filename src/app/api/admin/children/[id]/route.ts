import { NextResponse } from "next/server";
import { getChildCore } from "@/lib/children";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const child = await getChildCore(id);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ child });
}
