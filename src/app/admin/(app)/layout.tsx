import { redirect } from "next/navigation";
import { getAdminId } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";

// Wraps every authenticated admin screen: real session verification (middleware
// only checks cookie presence) + the persistent bottom tab bar.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const adminId = await getAdminId();
  if (!adminId) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-2">{children}</main>
      <BottomNav />
    </div>
  );
}
