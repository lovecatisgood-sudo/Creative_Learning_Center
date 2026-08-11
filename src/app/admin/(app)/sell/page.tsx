import { getCatalog, getPaymentInfo } from "@/lib/catalog";
import { getChildCore } from "@/lib/children";
import { getActiveSessionForChild } from "@/lib/sessions";
import { SellClient } from "./SellClient";

// A4/A5 — Sell. Optional ?childId preselects the child (from the Child page or
// the session "+ Add 1 hour" shortcut). The 80 THB Playroom extension is
// enabled only for a running Kids Playroom session.
export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string; extendSession?: string }>;
}) {
  const query = await searchParams;
  const catalog = await getCatalog();
  const paymentInfo = getPaymentInfo();

  const childId = Number(query.childId);
  const requestedExtendSessionId = Number.isInteger(Number(query.extendSession))
    ? Number(query.extendSession)
    : null;
  let child = null;
  let playroomSessionId: number | null = null;
  if (Number.isInteger(childId)) {
    child = await getChildCore(childId);
    if (child) {
      const activeSession = await getActiveSessionForChild(childId);
      if (activeSession?.productSku.startsWith("PLAYROOM_ENTRY_")) playroomSessionId = activeSession.id;
    }
  }

  return (
    <SellClient
      catalog={catalog}
      paymentInfo={paymentInfo}
      initialChild={
        child ? { id: child.id, name: child.name, parentName: child.parent?.name ?? "" } : null
      }
      initialPlayroomSessionId={playroomSessionId}
      preloadPlayroomExtension={Boolean(playroomSessionId && requestedExtendSessionId === playroomSessionId)}
    />
  );
}
