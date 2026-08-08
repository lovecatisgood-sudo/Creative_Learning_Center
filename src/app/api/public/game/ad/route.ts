import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { gamePlayers, houseAdCampaigns, houseAdEvents } from "@/db/schema";
import { houseAdFillPercent, houseAdsEnabled } from "@/lib/game-features";

export async function GET(request: Request) {
  if (!houseAdsEnabled() || Math.random() * 100 >= houseAdFillPercent()) {
    return NextResponse.json({ campaign: null }, { headers: { "cache-control": "no-store" } });
  }
  const url = new URL(request.url);
  const language = url.searchParams.get("language") === "th" ? "th" : "en";
  const publicId = String(url.searchParams.get("playerId") ?? "").trim();

  try {
    const now = new Date();
    const campaigns = (await db.select().from(houseAdCampaigns).where(eq(houseAdCampaigns.active, true))).filter(
      (campaign) =>
        Boolean(campaign.videoUrl) &&
        (campaign.language === "all" || campaign.language === language) &&
        (!campaign.startsAt || campaign.startsAt <= now) &&
        (!campaign.endsAt || campaign.endsAt > now),
    );

    let playerId: number | null = null;
    const latestImpression = new Map<number, Date>();
    if (publicId) {
      const [player] = await db.select({ id: gamePlayers.id }).from(gamePlayers).where(eq(gamePlayers.publicId, publicId)).limit(1);
      playerId = player?.id ?? null;
      if (playerId) {
        const events = await db
          .select({ campaignId: houseAdEvents.campaignId, createdAt: houseAdEvents.createdAt })
          .from(houseAdEvents)
          .where(and(eq(houseAdEvents.playerId, playerId), eq(houseAdEvents.eventType, "impression")))
          .orderBy(desc(houseAdEvents.createdAt))
          .limit(200);
        for (const event of events) if (!latestImpression.has(event.campaignId)) latestImpression.set(event.campaignId, event.createdAt);
      }
    }

    const eligible = campaigns.filter((campaign) => {
      const last = latestImpression.get(campaign.id);
      return !last || now.getTime() - last.getTime() >= campaign.cooldownSeconds * 1_000;
    });
    const campaign = weightedChoice(eligible);
    return NextResponse.json(
      {
        campaign: campaign
          ? {
              id: campaign.id,
              name: campaign.name,
              category: campaign.category,
              videoUrl: campaign.videoUrl,
              posterUrl: campaign.posterUrl,
              ctaLabel: campaign.ctaLabel,
              destinationUrl: campaign.destinationUrl,
              skipAfterSeconds: campaign.skipAfterSeconds,
            }
          : null,
      },
      { headers: { "cache-control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("House ad selection failed", error);
    return NextResponse.json({ campaign: null }, { headers: { "cache-control": "no-store" } });
  }
}

function weightedChoice<T extends { weight: number }>(items: T[]): T | null {
  const total = items.reduce((sum, item) => sum + Math.max(1, item.weight), 0);
  if (!total) return null;
  let cursor = Math.random() * total;
  for (const item of items) {
    cursor -= Math.max(1, item.weight);
    if (cursor <= 0) return item;
  }
  return items.at(-1) ?? null;
}
