import { desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, houseAdCampaigns, houseAdEvents } from "@/db/schema";
import { adminApiError } from "@/lib/admin-api";
import { requireManager } from "@/lib/auth";
import { HouseAdValidationError, parseHouseAdCampaignInput } from "@/lib/house-ads";

export async function GET() {
  try {
    await requireManager();
    const [campaigns, totals] = await Promise.all([
      db.select().from(houseAdCampaigns).orderBy(desc(houseAdCampaigns.updatedAt)),
      db
        .select({
          campaignId: houseAdEvents.campaignId,
          eventType: houseAdEvents.eventType,
          value: sql<number>`count(*)`,
        })
        .from(houseAdEvents)
        .groupBy(houseAdEvents.campaignId, houseAdEvents.eventType),
    ]);
    const stats: Record<number, Record<string, number>> = {};
    for (const total of totals) {
      stats[total.campaignId] ??= {};
      stats[total.campaignId][total.eventType] = Number(total.value);
    }
    return NextResponse.json({ campaigns, stats }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return adminApiError(error, "Unable to load house ads");
  }
}
export async function POST(request: Request) {
  try {
    const manager = await requireManager();
    const input = parseHouseAdCampaignInput(await request.json().catch(() => null));
    const [campaign] = await db.transaction(async (tx) => {
      const [created] = await tx.insert(houseAdCampaigns).values(input).returning();
      await tx.insert(auditLog).values({
        adminId: manager.id > 0 ? manager.id : null,
        action: "house_ad_created",
        entity: "house_ad_campaign",
        entityId: created.id,
        detail: { name: created.name, active: created.active },
      });
      return [created];
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof HouseAdValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return adminApiError(error, "Unable to create house ad");
  }
}
