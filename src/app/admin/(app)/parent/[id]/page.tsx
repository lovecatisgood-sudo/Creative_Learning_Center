import { notFound } from "next/navigation";
import { getParentDetail } from "@/lib/parents";
import { ParentClient } from "./ParentClient";

// Parent detail — reached from the Search directory (A-search). Shows the
// parent's own fields, their children, and their purchase history.
export default async function ParentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const detail = await getParentDetail(id);
  if (!detail) notFound();

  return <ParentClient detail={detail} />;
}
