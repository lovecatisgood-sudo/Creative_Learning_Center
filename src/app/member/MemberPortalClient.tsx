"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import type { MemberPortalData } from "@/lib/member-data";

type Tab = "home" | "packages" | "history" | "profile";

export function MemberPortalClient({ initial }: { initial: MemberPortalData }) {
  const pathname = usePathname();
  const router = useRouter();
  const th = !pathname.startsWith("/EN/");
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<Tab>("home");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = window.setInterval(async () => {
      const response = await fetch("/api/member/me", { cache: "no-store" }).catch(() => null);
      if (response?.ok) setData(await response.json());
    }, 30_000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(refresh);
    };
  }, []);

  const activeSessions = useMemo(
    () => data.children.flatMap((child) => child.activeSession ? [{ child, session: child.activeSession }] : []),
    [data.children],
  );

  async function signOut() {
    await fetch("/api/member/logout", { method: "POST" });
    router.push(th ? "/member/sign-in" : "/EN/member/sign-in");
    router.refresh();
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line bg-card px-4 py-2 safe-top">
        <div className="flex min-w-0 items-center gap-2">
          <Logo size={34} alt="" />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-extrabold text-brown">Siamese Cat Member</div>
            <div className="truncate text-xs text-meta">{data.member.publicUid}</div>
          </div>
        </div>
        <a
          href={th ? "/EN/member" : "/member"}
          className="min-h-[44px] rounded-full border border-line px-3 py-2 text-sm font-bold"
        >
          {th ? "EN" : "ไทย"}
        </a>
      </header>

      {!data.member.verified && (
        <button
          type="button"
          onClick={() => setTab("profile")}
          className="flex min-h-[52px] items-center justify-between bg-warnbg px-4 py-2 text-left text-sm font-semibold text-warn"
        >
          <span>{th ? "ผูกอีเมลเพื่อเก็บสิทธิ์การเข้าถึงแพ็กเกจ" : "Bind your email to keep access to your packages"}</span>
          <span aria-hidden>›</span>
        </button>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8">
        {tab === "home" && (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <section className="rounded-2xl bg-brown p-5 text-cream">
              <p className="text-sm text-cream/70">{th ? "ยินดีต้อนรับ" : "Welcome"}</p>
              <h1 className="mt-1 text-2xl font-extrabold">{data.member.name}</h1>
              <p className="mt-3 font-mono text-sm tracking-wide">{data.member.publicUid}</p>
            </section>

            {activeSessions.map(({ child, session }) => (
              <section key={session.id} className="rounded-2xl border-2 border-teal bg-tealbg p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-tealdeep">
                  {th ? "กำลังใช้งาน" : "Current session"} · {child.name}
                </p>
                <h2 className="mt-1 text-xl font-extrabold">{th ? session.nameTh : session.nameEn}</h2>
                <p className="mt-4 text-sm text-meta">{th ? "เวลารับกลับ" : "Pickup time"}</p>
                <p className="text-4xl font-extrabold text-brown">{formatTime(session.plannedEndAt, th)}</p>
                <p className="mt-2 font-bold text-tealdeep">{countdown(session.plannedEndAt, now, th)}</p>
              </section>
            ))}

            {activeSessions.length === 0 && (
              <section className="rounded-2xl border border-line bg-card p-4">
                <h2 className="font-extrabold">{th ? "ไม่มีเซสชันที่กำลังใช้งาน" : "No active session"}</h2>
                <p className="mt-1 text-sm text-meta">{th ? "แพ็กเกจของคุณจะแสดงด้านล่าง" : "Your available packages appear below."}</p>
              </section>
            )}

            <PackageGroups data={data} th={th} compact />
          </div>
        )}

        {tab === "packages" && <PackageGroups data={data} th={th} />}

        {tab === "history" && (
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-3 text-2xl font-extrabold">{th ? "ประวัติ" : "History"}</h1>
            {data.history.length === 0 ? (
              <Empty text={th ? "ยังไม่มีประวัติ" : "No history yet"} />
            ) : (
              <ul className="flex flex-col gap-2">
                {data.history.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="rounded-xl border border-line bg-card p-3">
                    {item.kind === "purchase" ? <a href={`${th ? "" : "/EN"}/member/receipt/${item.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold">{th ? item.titleTh : item.titleEn}</div>
                        <div className="text-sm text-meta">{item.childName} · {th ? item.detailTh : item.detailEn}</div>
                      </div>
                      <time className="shrink-0 text-xs text-meta">{formatDate(item.at, th)}</time>
                    </div>
                    </a> : <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="truncate font-bold">{th ? item.titleTh : item.titleEn}</div><div className="text-sm text-meta">{item.childName} · {th ? item.detailTh : item.detailEn}</div></div>
                      <time className="shrink-0 text-xs text-meta">{formatDate(item.at, th)}</time>
                    </div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-3 text-2xl font-extrabold">{th ? "โปรไฟล์สมาชิก" : "Member profile"}</h1>
            <section className="rounded-2xl border border-line bg-card p-4">
              <ProfileRow label={th ? "รหัสสมาชิก" : "Member ID"} value={data.member.publicUid} />
              <ProfileRow label={th ? "ชื่อผู้ปกครอง" : "Guardian"} value={data.member.name} />
              <ProfileRow label={th ? "โทรศัพท์" : "Phone"} value={data.member.phone} />
              <ProfileRow
                label={th ? "อีเมล" : "Email"}
                value={data.member.email || (th ? "ยังไม่ได้ผูก" : "Not bound")}
              />
            </section>
            {!data.member.verified && (
              <section className="mt-4 rounded-2xl border border-warn/40 bg-warnbg p-4">
                <h2 className="font-extrabold text-warn">{th ? "เก็บสิทธิ์การเข้าถึงของคุณ" : "Keep access to your account"}</h2>
                <p className="mt-1 text-sm text-warn">
                  {th
                    ? "บัญชีชั่วคราวจะหมดอายุ ผูกอีเมลเพื่อเข้าสู่ระบบได้จากทุกอุปกรณ์"
                    : "Temporary access expires. Bind an email to sign in from any device."}
                </p>
                <a href={th ? "/member/bind-email" : "/EN/member/bind-email"} className="btn-primary mt-3">
                  {th ? "ผูกอีเมล" : "Bind email"}
                </a>
              </section>
            )}
            <section className="mt-4 rounded-2xl border border-teal/30 bg-tealbg p-4">
              <h2 className="font-extrabold text-tealdeep">{th ? "Siamese Cat Member แบบใช้ร่วมกัน" : "Universal Siamese Cat Member"}</h2>
              <p className="mt-1 text-sm text-meta">
                {th
                  ? "เชื่อมต่อโปรไฟล์ Creative Club นี้กับบัญชีที่ใช้ผ่าน Google หรืออีเมลในเกมและบริการ Siamese Cat อื่น ๆ โดยไม่เปลี่ยนบุตร แพ็กเกจ หรือประวัติเดิม"
                  : "Connect this Creative Club profile to the Google-or-email identity used across approved Siamese Cat products. Existing children, packages, and history stay unchanged."}
              </p>
              <a href="/api/public/member/connect/start" className="btn-primary mt-3">
                {th ? "เชื่อมต่อหรือยืนยันอีกครั้ง" : "Connect or verify membership"}
              </a>
            </section>
            <button type="button" onClick={signOut} className="btn-ghost mt-4">
              {th ? "ออกจากระบบ" : "Sign out"}
            </button>
          </div>
        )}
      </main>

      <nav className="member-bottom-nav grid grid-cols-4 border-t border-brown2 bg-brown text-cream safe-bottom">
        <TabButton active={tab === "home"} onClick={() => setTab("home")} icon="⌂" label={th ? "หน้าหลัก" : "Home"} />
        <TabButton active={tab === "packages"} onClick={() => setTab("packages")} icon="▣" label={th ? "แพ็กเกจ" : "Packages"} />
        <TabButton active={tab === "history"} onClick={() => setTab("history")} icon="◷" label={th ? "ประวัติ" : "History"} />
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon="●" label={th ? "โปรไฟล์" : "Profile"} />
      </nav>
    </div>
  );
}

function PackageGroups({ data, th, compact = false }: { data: MemberPortalData; th: boolean; compact?: boolean }) {
  const children = data.children
    .map((child) => ({ ...child, packages: compact ? child.packages.filter((pkg) => pkg.status === "available" || pkg.status === "active").slice(0, 3) : child.packages }))
    .filter((child) => !compact || child.packages.length > 0);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-3 text-2xl font-extrabold">{compact ? (th ? "แพ็กเกจของฉัน" : "My packages") : (th ? "แพ็กเกจทั้งหมด" : "All packages")}</h1>
      {children.length === 0 ? <Empty text={th ? "ยังไม่มีแพ็กเกจ" : "No packages yet"} /> : children.map((child) => (
        <section key={child.id} className="mb-5">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-meta">{child.name}</h2>
          <div className="flex flex-col gap-2">
            {child.packages.map((pkg) => {
              const balances = [
                pkg.hoursTotal > 0 ? `${pkg.hoursRemaining}/${pkg.hoursTotal} ${th ? "ชม." : "hrs"}` : "",
                pkg.crayonCreditsRemaining > 0 ? `${pkg.crayonCreditsRemaining} ${th ? "สีเทียน" : "crayon"}` : "",
                pkg.clayCreditsRemaining > 0 ? `${pkg.clayCreditsRemaining} ${th ? "ดินปั้น" : "clay"}` : "",
                pkg.extraHoursRemaining > 0 ? `+${pkg.extraHoursRemaining}h` : "",
              ].filter(Boolean);
              return (
                <article key={pkg.id} className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 flex-1 text-lg font-extrabold">{th ? pkg.nameTh : pkg.nameEn}</h3>
                    <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-bold uppercase text-meta">{statusLabel(pkg.status, th)}</span>
                  </div>
                  {balances.length > 0 && <p className="mt-2 text-xl font-extrabold text-brown">{balances.join(" · ")}</p>}
                  {pkg.expiresAt && <p className="mt-1 text-sm text-meta">{th ? "หมดอายุ" : "Expires"} {formatDate(pkg.expiresAt, th)}</p>}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return <button type="button" onClick={onClick} className={`flex min-h-[54px] flex-col items-center justify-center text-xs font-bold ${active ? "text-teal" : "text-cream/70"}`}><span className="text-lg leading-none" aria-hidden>{icon}</span>{label}</button>;
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-line py-3 last:border-0"><div className="text-xs font-bold uppercase tracking-wide text-meta">{label}</div><div className="mt-0.5 break-words font-semibold">{value}</div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-line bg-card/60 p-6 text-center text-sm text-meta">{text}</div>;
}

function statusLabel(status: string, th: boolean) {
  const labels: Record<string, [string, string]> = {
    available: ["พร้อมใช้", "Available"], active: ["กำลังใช้", "Active"], consumed: ["ใช้แล้ว", "Consumed"], expired: ["หมดอายุ", "Expired"],
  };
  return labels[status]?.[th ? 0 : 1] ?? status;
}

function formatDate(value: string, th: boolean) {
  return new Date(value).toLocaleDateString(th ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(value: string, th: boolean) {
  return new Date(value).toLocaleTimeString(th ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });
}

function countdown(value: string, now: number, th: boolean) {
  const remaining = new Date(value).getTime() - now;
  if (remaining <= 0) return th ? "เกินเวลารับกลับ" : "Pickup time has passed";
  const minutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return th ? `เหลือ ${hours ? `${hours} ชม. ` : ""}${mins} นาที` : `${hours ? `${hours}h ` : ""}${mins}m remaining`;
}
