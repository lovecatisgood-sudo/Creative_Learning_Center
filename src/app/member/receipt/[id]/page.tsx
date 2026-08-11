import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentMember } from "@/lib/member-auth";
import { getMemberReceipt } from "@/lib/member-receipt";
import { MemberReceiptClient } from "./MemberReceiptClient";

export const dynamic = "force-dynamic";

export default async function MemberReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const english = (await headers()).get("x-sccc-language") === "en";
  const member = await getCurrentMember();
  if (!member) redirect(english ? "/EN/member/sign-in" : "/member/sign-in");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const receipt = await getMemberReceipt(member, id);
  if (!receipt) notFound();
  return <MemberReceiptClient receipt={receipt} />;
}
