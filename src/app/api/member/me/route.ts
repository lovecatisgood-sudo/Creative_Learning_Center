import { NextResponse } from "next/server";
import { requireMember, MemberUnauthorizedError } from "@/lib/member-auth";
import { getMemberPortalData } from "@/lib/member-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const member = await requireMember();
    const data = await getMemberPortalData(member);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof MemberUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
