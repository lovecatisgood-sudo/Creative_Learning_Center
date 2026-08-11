import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentMember } from "@/lib/member-auth";
import { getMemberPortalData } from "@/lib/member-data";
import { MemberPortalClient } from "./MemberPortalClient";

export const dynamic = "force-dynamic";

export default async function MemberPage() {
  const english = (await headers()).get("x-sccc-language") === "en";
  const member = await getCurrentMember();
  if (!member) redirect(english ? "/EN/member/sign-in" : "/member/sign-in");
  const data = await getMemberPortalData(member);
  if (!data) redirect(english ? "/EN/member/sign-in" : "/member/sign-in");
  return <MemberPortalClient initial={data} />;
}
