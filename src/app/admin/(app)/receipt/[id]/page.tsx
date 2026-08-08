import { notFound } from "next/navigation";
import { getReceipt } from "@/lib/receipt";
import { ReceiptClient } from "./ReceiptClient";

// A6 — Receipt. Server-fetches the order; the client renders the 80mm ticket
// with print / save-as-image / start-a-package-now.
export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ justPaid?: string }>;
}) {
  const [{ id: rawId }, { justPaid }] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();
  const data = await getReceipt(id);
  if (!data) notFound();
  return <ReceiptClient data={data} justPaid={justPaid === "1"} />;
}
