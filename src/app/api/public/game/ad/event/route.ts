import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { gamePlayers, houseAdCampaigns, houseAdEvents } from "@/db/schema";
import { houseAdsEnabled } from "@/lib/game-features";
import { HOUSE_AD_EVENTS } from "@/lib/house-ads";

export async function POST(request: Request) {
  if (!houseAdsEnabled()) {
    return NextResponse.json({ error: "House ads are not available" }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const campaignId = Number(body.campaignId);
  const eventType = String(body.eventType ?? "");
  const publicId = String(body.playerId ?? "").trim();
  const placement = String(body.placement ?? "game_over_restart").trim();

  if (!Number.isInteger(campaignId) || campaignId < 1 || !HOUSE_AD_EVENTS.includes(eventType as (typeof HOUSE_AD_EVENTS)[number])) {
    return NextResponse.json({ error: "Invalid ad event" }, { status: 422 });
  }
  if (!placement || placement.length > 80) return NextResponse.json({ error: "Invalid placement" }, { status: 422 });

  try {
    const [campaign] = await db.select({ id: houseAdCampaigns.id }).from(houseAdCampaigns).where(eq(houseAdCampaigns.id, campaignId)).limit(1);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    let playerId: number | null = null;
    if (publicId) {
      const [player] = await db.select({ id: gamePlayers.id }).from(gamePlayers).where(eq(gamePlayers.publicId, publicId)).limit(1);
      playerId = player?.id ?? null;
    }
    await db.insert(houseAdEvents).values({ campaignId, playerId, eventType, placement });
    return NextResponse.json({ ok: true }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("House ad event save failed", error);
    return NextResponse.json({ error: "Unable to save ad event" }, { status: 500 });
  }
}
