import Link from "next/link";
import { and, count, desc, eq, gt, inArray, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { db } from "@/db";
import { memberAccessTokens, memberAccounts, packageInstances, parents } from "@/db/schema";
import { requireManagerPage } from "@/lib/admin-page-auth";
import { isMemberSchemaReady } from "@/lib/member-schema";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  await requireManagerPage();
  if (!isMemberSchemaReady()) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-paper">
        <AppBar title="Siamese Cat Members" right={<LogoutButton />} />
        <main className="flex-1 px-4 py-8 sm:px-6">
          <section className="mx-auto max-w-3xl rounded-2xl border border-warn/30 bg-warnbg p-5">
            <h1 className="text-xl font-extrabold">Member service is temporarily unavailable</h1>
            <p className="mt-2 text-sm text-meta">The established parent and child directory remains available while the member database upgrade recovers.</p>
            <Link href="/admin/search" className="mt-4 inline-block rounded-lg bg-tealdeep px-4 py-2 font-bold text-white">Open parent and child directory</Link>
          </section>
        </main>
      </div>
    );
  }
  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60_000);
  const [
    [total], [verified], [incomplete], [activePackages], [expiring], [unclaimed], duplicatePhones, recent,
  ] = await Promise.all([
    db.select({ value: count() }).from(memberAccounts),
    db.select({ value: count() }).from(memberAccounts).where(isNotNull(memberAccounts.emailVerifiedAt)),
    db.select({ value: count() }).from(memberAccounts).innerJoin(parents, eq(memberAccounts.parentId, parents.id)).where(or(eq(parents.profileComplete, false), sql`trim(${parents.name}) = ''`)),
    db.select({ value: count() }).from(packageInstances).where(and(inArray(packageInstances.status, ["available", "active"]), or(isNull(packageInstances.expiresAt), gt(packageInstances.expiresAt, now)))),
    db.select({ value: count() }).from(packageInstances).where(and(inArray(packageInstances.status, ["available", "active"]), gt(packageInstances.expiresAt, now), lt(packageInstances.expiresAt, inThirtyDays))),
    db.select({ value: count() }).from(memberAccessTokens).where(and(eq(memberAccessTokens.type, "purchase_claim"), isNull(memberAccessTokens.usedAt), gt(memberAccessTokens.expiresAt, now))),
    db.select({ phone: memberAccounts.phoneNormalized, value: count() }).from(memberAccounts).where(ne(memberAccounts.phoneNormalized, "")).groupBy(memberAccounts.phoneNormalized).having(sql`count(*) > 1`),
    db.select({
      id: memberAccounts.id,
      parentId: memberAccounts.parentId,
      publicUid: memberAccounts.publicUid,
      verifiedAt: memberAccounts.emailVerifiedAt,
      name: parents.name,
      phone: parents.phone,
      complete: parents.profileComplete,
      createdAt: memberAccounts.createdAt,
    }).from(memberAccounts).innerJoin(parents, eq(memberAccounts.parentId, parents.id)).orderBy(desc(memberAccounts.createdAt)).limit(50),
  ]);
  const temporary = Math.max(0, total.value - verified.value);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper">
      <AppBar title="Siamese Cat Members" right={<LogoutButton />} />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="สมาชิกทั้งหมด / Total" value={total.value} />
            <Metric label="ยืนยันแล้ว / Verified" value={verified.value} tone="ok" />
            <Metric label="ชั่วคราว / Temporary" value={temporary} tone="warn" />
            <Metric label="ข้อมูลไม่ครบ / Incomplete" value={incomplete.value} tone="warn" />
            <Metric label="แพ็กเกจใช้งาน / Active packages" value={activePackages.value} />
            <Metric label="หมดอายุใน 30 วัน / Expiring" value={expiring.value} tone="warn" />
            <Metric label="ลิงก์ยังไม่รับ / Unclaimed" value={unclaimed.value} />
            <Metric label="เบอร์ซ้ำ / Duplicate phones" value={duplicatePhones.length} tone={duplicatePhones.length ? "danger" : "ok"} />
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div><h1 className="text-xl font-extrabold">สมาชิกล่าสุด</h1><p className="text-sm text-meta">Recent members · use Search for the complete directory</p></div>
              <div className="flex gap-2"><Link href="/admin/members/merge" className="rounded-lg border border-danger/30 bg-card px-3 py-2 text-sm font-bold text-danger">Merge</Link><Link href="/admin/search" className="rounded-lg border border-line bg-card px-3 py-2 text-sm font-bold text-tealdeep">ค้นหา / Search</Link></div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {recent.map((member) => (
                <Link key={member.id} href={`/admin/parent/${member.parentId}`} className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h2 className="truncate font-extrabold">{member.name?.trim() || "Incomplete member"}</h2><p className="truncate text-sm text-meta">{member.phone}</p><p className="font-mono text-xs text-meta">{member.publicUid}</p></div>
                    <span className={`chip ${member.verifiedAt ? "bg-okbg text-ok" : "bg-warnbg text-warn"}`}>{member.verifiedAt ? "VERIFIED" : "TEMP"}</span>
                  </div>
                  {!member.complete && <p className="mt-2 text-xs font-bold text-warn">PROFILE INCOMPLETE</p>}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "ok" | "warn" | "danger" }) {
  const colors = tone === "ok" ? "border-ok/30 bg-okbg" : tone === "warn" ? "border-warn/30 bg-warnbg" : tone === "danger" ? "border-danger/30 bg-dangerbg" : "border-line bg-card";
  return <article className={`rounded-2xl border p-3 ${colors}`}><p className="text-xs font-bold text-meta">{label}</p><p className="mt-1 text-2xl font-extrabold">{value.toLocaleString()}</p></article>;
}
