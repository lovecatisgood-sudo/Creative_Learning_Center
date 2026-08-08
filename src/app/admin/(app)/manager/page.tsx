import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { db } from "@/db";
import { admins, auditLog, blogPosts, gamePlayers } from "@/db/schema";
import { requireManagerPage } from "@/lib/admin-page-auth";
import { getOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const [today, [team], [inquiries], [posts], [players], admin] = await Promise.all([
    getOverview("day", 0),
    db.select({ value: count() }).from(admins).where(eq(admins.active, true)),
    db.select({ value: count() }).from(auditLog).where(eq(auditLog.entity, "contact_inquiry")),
    db.select({ value: count() }).from(blogPosts),
    db.select({ value: count() }).from(gamePlayers),
    requireManagerPage(),
  ]);

  const tools = [
    { href: "/admin/overview", icon: "📊", title: "ยอดขายและรายงาน", subtitle: "Sales & reports", value: `${today.totals.grand.toLocaleString()} ฿` },
    { href: "/admin/inquiries", icon: "✉", title: "คำถามจากเว็บไซต์", subtitle: "Website inquiries", value: String(inquiries.value) },
    { href: "/admin/game", icon: "🎮", title: "ผู้เล่นเกม", subtitle: "Game players & scores", value: String(players.value) },
    { href: "/admin/blog", icon: "✎", title: "จัดการบล็อก", subtitle: "Blog publishing", value: String(posts.value) },
    { href: "/admin/team", icon: "👥", title: "บัญชีทีมงาน", subtitle: "Staff & manager access", value: String(team.value) },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <AppBar title="แดชบอร์ดผู้จัดการ" right={<LogoutButton />} />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 rounded-2xl bg-brown p-5 text-cream shadow-sm">
            <p className="text-sm text-cream/70">Manager dashboard</p>
            <h1 className="mt-1 text-2xl font-extrabold">
              {admin?.displayName || admin?.email || "Manager"}
            </h1>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Metric label="ยอดวันนี้" value={`${today.totals.grand.toLocaleString()} ฿`} />
              <Metric label="ออเดอร์" value={String(today.counts.orders)} />
              <Metric label="เช็คอิน" value={String(today.counts.sessions)} />
            </div>
          </div>

          <section aria-labelledby="manager-tools-title">
            <h2 id="manager-tools-title" className="mb-3 text-lg font-extrabold text-ink">
              เครื่องมือผู้จัดการ
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-sm transition hover:border-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
                >
                  <span className="text-3xl" aria-hidden="true">{tool.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold text-ink">{tool.title}</span>
                    <span className="block text-sm text-meta">{tool.subtitle}</span>
                  </span>
                  <span className="rounded-full bg-tealbg px-3 py-1 text-sm font-extrabold text-tealdeep">
                    {tool.value}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-5" aria-labelledby="operations-title">
            <h2 id="operations-title" className="mb-3 text-lg font-extrabold text-ink">งานหน้าร้าน</h2>
            <div className="grid grid-cols-3 gap-2">
              <OperationLink href="/admin/sessions" icon="⏱" label="เซสชัน" />
              <OperationLink href="/admin/search" icon="🔍" label="ผู้ปกครองและเด็ก" />
              <OperationLink href="/admin/sell" icon="🛒" label="เปิดออเดอร์" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/10 p-3"><div className="text-xs text-cream/70">{label}</div><div className="mt-1 text-lg font-extrabold">{value}</div></div>;
}

function OperationLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return <Link href={href} className="rounded-xl border border-line bg-card p-3 text-center font-bold text-ink"><span className="mb-1 block text-2xl" aria-hidden="true">{icon}</span>{label}</Link>;
}
