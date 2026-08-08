import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, houseAdCampaigns } from "@/db/schema";
import { adminApiError } from "@/lib/admin-api";
import { requireManager } from "@/lib/auth";
import { houseAdId, HouseAdValidationError, parseHouseAdCampaignInput } from "@/lib/house-ads";

function requestId(request: Request) {
  return houseAdId(new URL(request.url).pathname.split("/").filter(Boolean).at(-1) ?? "");
}
export async function PATCH(request: Request) {
  try {
    const manager = await requireManager();
    const id = requestId(request);
    const input = parseHouseAdCampaignInput(await request.json().catch(() => null));
    const [existing] = await db.select({ id: houseAdCampaigns.id }).from(houseAdCampaigns).where(eq(houseAdCampaigns.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const [campaign] = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(houseAdCampaigns)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(houseAdCampaigns.id, id))
        .returning();
      await tx.insert(auditLog).values({
        adminId: manager.id > 0 ? manager.id : null,
        action: "house_ad_updated",
        entity: "house_ad_campaign",
        entityId: id,
        detail: { name: updated.name, active: updated.active },
      });
      return [updated];
    });
    return NextResponse.json({ campaign });
  } catch (error) {
    if (error instanceof HouseAdValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return adminApiError(error, "Unable to update house ad");
  }
}
