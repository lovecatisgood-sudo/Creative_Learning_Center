import { redirect } from "next/navigation";
import { getAdminId } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";

// Wraps every authenticated admin screen: real session verification (middleware
// only checks cookie presence) + the persistent bottom tab bar.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const adminId = await getAdminId();
  if (!adminId) redirect("/admin/login");

  // Exactly one viewport tall: `main` gets the remaining height after the
  // (fixed-height, sticky) BottomNav and is itself a flex column, so each page
  // client below only needs `flex-1 min-h-0` to fill it — no page should ever
  // force document-level scroll for short content.
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <BottomNav />
    </div>
  );
}
