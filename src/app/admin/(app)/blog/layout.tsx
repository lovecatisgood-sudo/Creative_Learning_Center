import { requireManagerPage } from "@/lib/admin-page-auth";

export default async function BlogManagerLayout({ children }: { children: React.ReactNode }) {
  await requireManagerPage();
  return children;
}
