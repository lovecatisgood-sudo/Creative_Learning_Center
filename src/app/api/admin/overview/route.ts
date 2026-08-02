import { NextResponse } from "next/server";
import { getOverview, type Unit } from "@/lib/overview";
import { requireManager } from "@/lib/auth";
import { adminApiError } from "@/lib/admin-api";

export async function GET(req: Request) {
  try {
    await requireManager();
  } catch (e) {
    return adminApiError(e, "Unable to load overview");
  }

  const url = new URL(req.url);
  const unitParam = url.searchParams.get("unit");
  const unit: Unit = unitParam === "week" || unitParam === "month" ? unitParam : "day";
  const offset = Math.min(0, Math.trunc(Number(url.searchParams.get("offset") ?? "0")) || 0);

  const data = await getOverview(unit, offset);
  return NextResponse.json(data);
}
