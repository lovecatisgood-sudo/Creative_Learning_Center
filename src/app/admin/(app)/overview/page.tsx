import { getOverview } from "@/lib/overview";
import { OverviewClient } from "./OverviewClient";
import { requireManagerPage } from "@/lib/admin-page-auth";

// A11 — Overview. Server-renders Day/today; the client switches unit + period.
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  await requireManagerPage();
  const initial = await getOverview("day", 0);
  return <OverviewClient initial={initial} />;
}
