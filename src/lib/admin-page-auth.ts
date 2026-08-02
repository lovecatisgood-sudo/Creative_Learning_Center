import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export async function requireManagerPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "manager") redirect("/admin/sessions");
  return admin;
}
