import { NextResponse } from "next/server";
import { getGameLoginConfig } from "@/lib/game-features";

export async function GET() {
  const config = getGameLoginConfig();
  return NextResponse.json(
    {
      loginEnabled: config.enabled,
      googleEnabled: config.enabled,
      googleClientId: config.enabled ? config.googleClientId : "",
    },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
