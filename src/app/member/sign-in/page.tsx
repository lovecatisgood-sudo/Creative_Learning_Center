import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/member-auth";
import { headers } from "next/headers";
import { MemberSignInClient } from "./MemberSignInClient";

export const dynamic = "force-dynamic";

export default async function MemberSignInPage() {
  const english = (await headers()).get("x-sccc-language") === "en";
  if (await getCurrentMember()) redirect(english ? "/EN/member" : "/member");
  return <MemberSignInClient />;
}
