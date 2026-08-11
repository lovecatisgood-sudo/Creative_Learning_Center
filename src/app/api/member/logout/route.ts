import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";

export async function POST() {
  const session = await getMemberSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
