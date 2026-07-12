import { notFound } from "next/navigation";
import { getChildCore, getSiblings } from "@/lib/children";
import { getChildPackages, getChildHistory } from "@/lib/packages";
import { getActiveSessionForChild } from "@/lib/sessions";
import { ChildClient } from "./ChildClient";

// A3 — Child page. Fetches core + packages + active session + history on the
// server, then hands off to a client shell for sheets and navigation.
export default async function ChildPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const child = await getChildCore(id);
  if (!child) notFound();

  const [packages, activeSession, history, siblings] = await Promise.all([
    getChildPackages(id),
    getActiveSessionForChild(id),
    getChildHistory(id),
    getSiblings(id),
  ]);

  return (
    <ChildClient
      child={child}
      packages={packages}
      activeSession={activeSession}
      history={history}
      siblings={siblings}
    />
  );
}
