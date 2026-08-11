import { requireManagerPage } from "@/lib/admin-page-auth";
import { MergeMembersClient } from "./MergeMembersClient";

export default async function MergeMembersPage() {
  await requireManagerPage();
  return <MergeMembersClient />;
}
