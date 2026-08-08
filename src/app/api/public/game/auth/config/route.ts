import { NextResponse } from "next/server";
import { getRoyaltyFeatureConfig } from "@/lib/game-features";

export async function GET() {
  const config = getRoyaltyFeatureConfig();
  return NextResponse.json(
    {
      royaltyEnabled: config.enabled,
      googleEnabled: config.enabled,
      googleClientId: config.enabled ? config.googleClientId : "",
      campaignUrl: config.enabled ? config.campaignUrl : "",
    },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
