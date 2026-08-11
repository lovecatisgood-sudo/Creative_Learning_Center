import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/member-auth";
import { headers } from "next/headers";
import { BindEmailClient } from "./BindEmailClient";

export const dynamic = "force-dynamic";

export default async function BindEmailPage() {
  const english = (await headers()).get("x-sccc-language") === "en";
  const member = await getCurrentMember();
  if (!member) redirect(english ? "/EN/member/sign-in" : "/member/sign-in");
  if (member.emailVerifiedAt) redirect(english ? "/EN/member" : "/member");
  return <BindEmailClient />;
}
