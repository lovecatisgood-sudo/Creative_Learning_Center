import { AppBar } from "@/components/AppBar";
import { requireManagerPage } from "@/lib/admin-page-auth";
import { HouseAdsClient } from "./HouseAdsClient";

export const dynamic = "force-dynamic";

export default async function HouseAdsPage() {
  await requireManagerPage();
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <AppBar title="Game Ads" />
      <HouseAdsClient />
    </div>
  );
}
