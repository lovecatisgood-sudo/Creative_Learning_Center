import { notFound } from "next/navigation";
import { getSessionDetail } from "@/lib/sessions";
import { SessionDetailClient } from "./SessionDetailClient";

// A8/A9 — Session detail (with the just-started pickup slip when ?started=1).
export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { started?: string };
}) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const detail = await getSessionDetail(id);
  if (!detail) notFound();
  return <SessionDetailClient detail={detail} justStarted={searchParams.started === "1"} />;
}
