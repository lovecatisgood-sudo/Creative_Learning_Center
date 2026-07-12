import { getCatalog, getPaymentInfo } from "@/lib/catalog";
import { getChildCore } from "@/lib/children";
import { getActiveSessionForChild } from "@/lib/sessions";
import { SellClient } from "./SellClient";

// A4/A5 — Sell. Optional ?childId preselects the child (from the Child page or
// the session "+ Add 1 hour" shortcut). EXTRA_1H is enabled only when the child
// has a running session.
export default async function SellPage({
  searchParams,
}: {
  searchParams: { childId?: string; extendSession?: string };
}) {
  const catalog = await getCatalog();
  const paymentInfo = getPaymentInfo();

  const childId = Number(searchParams.childId);
  const extendSessionId = Number.isInteger(Number(searchParams.extendSession))
    ? Number(searchParams.extendSession)
    : null;
  let child = null;
  let hasRunningSession = false;
  if (Number.isInteger(childId)) {
    child = await getChildCore(childId);
    if (child) hasRunningSession = Boolean(await getActiveSessionForChild(childId));
  }

  return (
    <SellClient
      catalog={catalog}
      paymentInfo={paymentInfo}
      initialChild={
        child ? { id: child.id, name: child.name, parentName: child.parent?.name ?? "" } : null
      }
      initialHasRunningSession={hasRunningSession}
      extendSessionId={extendSessionId}
    />
  );
}
