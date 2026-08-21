import { NextResponse } from "next/server";
import { getGoogleGameLoginConfig, getSiameseGameLoginConfig } from "@/lib/game-features";
import { ensureSiameseGameSchemaReady } from "@/lib/siamese-game-schema";

export async function GET(request: Request) {
  const game = new URL(request.url).searchParams.get("game");
  if (game !== "car-maze") {
    const config = getGoogleGameLoginConfig();
    return NextResponse.json(
      {
        loginEnabled: config.enabled,
        googleEnabled: config.enabled,
        googleClientId: config.enabled ? config.googleClientId : "",
      },
      { headers: { "cache-control": "public, max-age=300" } },
    );
  }
  try {
    if (!(await ensureSiameseGameSchemaReady())) {
      return NextResponse.json(
        { error: "Game sign-in is temporarily unavailable", loginEnabled: false, siameseEnabled: false, issuer: "" },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    const config = getSiameseGameLoginConfig("car-maze");
    return NextResponse.json(
      {
        loginEnabled: config.enabled,
        siameseEnabled: config.enabled,
        issuer: config.enabled ? config.issuer : "",
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Siamese Cat game auth configuration is invalid", error);
    return NextResponse.json(
      { error: "Game sign-in configuration is invalid", loginEnabled: false, siameseEnabled: false, issuer: "" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
