import { NextResponse } from "next/server";
import { getOverview, type Unit } from "@/lib/overview";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const url = new URL(req.url);
  const unitParam = url.searchParams.get("unit");
  const unit: Unit = unitParam === "week" || unitParam === "month" ? unitParam : "day";
  const offset = Math.min(0, Math.trunc(Number(url.searchParams.get("offset") ?? "0")) || 0);

  const data = await getOverview(unit, offset);
  return NextResponse.json(data);
}
