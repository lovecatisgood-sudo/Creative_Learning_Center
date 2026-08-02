"use client";

import { FormEvent, useState } from "react";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { AdminRole } from "@/lib/admin-roles";

type TeamAccount = {
  id: number;
  email: string;
  displayName: string | null;
  role: AdminRole;
  active: boolean;
};

type ApiResponse = { account?: TeamAccount; error?: string };

export function TeamClient({ initialTeam, currentAdminId }: { initialTeam: TeamAccount[]; currentAdminId: number }) {
  const { lang } = useLang();
  const th = lang === "th";
  const [team, setTeam] = useState(initialTeam);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, password, role }),
    });
    const data = (await response.json()) as ApiResponse;
    setBusy(false);
    if (!response.ok || !data.account) {
      setMessage({ kind: "error", text: data.error || (th ? "สร้างบัญชีไม่สำเร็จ" : "Unable to create account") });
      return;
    }
    setTeam((current) => [...current, data.account!]);
    setDisplayName("");
    setEmail("");
    setPassword("");
    setRole("staff");
    setMessage({ kind: "ok", text: th ? "สร้างบัญชีแล้ว" : "Account created" });
  }

  async function updateAccount(id: number, changes: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const data = (await response.json()) as ApiResponse;
    setBusy(false);
    if (!response.ok || !data.account) {
      setMessage({ kind: "error", text: data.error || (th ? "แก้ไขบัญชีไม่สำเร็จ" : "Unable to update account") });
      return false;
    }
    setTeam((current) => current.map((account) => account.id === id ? data.account! : account));
    setMessage({ kind: "ok", text: th ? "บันทึกแล้ว" : "Changes saved" });
    return true;
  }

  async function submitReset(id: number) {
    if (await updateAccount(id, { password: resetPassword })) {
      setResetId(null);
      setResetPassword("");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper">
      <AppBar title={th ? "บัญชีทีมงาน" : "Team accounts"} right={<LogoutButton />} />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(360px,1.2fr)]">
          <form onSubmit={createAccount} className="h-fit rounded-2xl border border-line bg-card p-4 shadow-sm">
            <h2 className="text-lg font-extrabold text-ink">{th ? "เพิ่มบัญชี" : "Add account"}</h2>
            <p className="mb-4 text-sm text-meta">
              {th ? "บัญชีใหม่เริ่มต้นเป็นพนักงานหน้าร้าน" : "New accounts default to shop staff."}
            </p>
            <Field label={th ? "ชื่อที่แสดง" : "Display name"}>
              <input className="field" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} />
            </Field>
            <Field label={th ? "อีเมล" : "Email"}>
              <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label={th ? "รหัสผ่าน (อย่างน้อย 12 ตัว)" : "Password (12+ characters)"}>
              <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required />
            </Field>
            <Field label={th ? "สิทธิ์" : "Role"}>
              <select className="field" value={role} onChange={(event) => setRole(event.target.value as AdminRole)}>
                <option value="staff">{th ? "พนักงาน" : "Staff"}</option>
                <option value="manager">{th ? "ผู้จัดการ" : "Manager"}</option>
              </select>
            </Field>
            <button className="btn-primary mt-2" type="submit" disabled={busy}>
              {busy ? (th ? "กำลังบันทึก…" : "Saving…") : (th ? "สร้างบัญชี" : "Create account")}
            </button>
          </form>

          <section aria-labelledby="team-list-title">
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <h2 id="team-list-title" className="text-lg font-extrabold text-ink">{th ? "สมาชิกทีม" : "Team members"}</h2>
                <p className="text-sm text-meta">{team.filter((account) => account.active).length} {th ? "บัญชีที่ใช้งาน" : "active accounts"}</p>
              </div>
            </div>

            {message && (
              <p role="status" className={`mb-3 rounded-xl p-3 text-sm font-semibold ${message.kind === "ok" ? "bg-okbg text-ok" : "bg-dangerbg text-danger"}`}>
                {message.text}
              </p>
            )}

            <div className="grid gap-3">
              {team.map((account) => {
                const self = account.id === currentAdminId;
                return (
                  <article key={account.id} className={`rounded-2xl border bg-card p-4 shadow-sm ${account.active ? "border-line" : "border-line opacity-60"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-extrabold text-ink">{account.displayName || account.email}</h3>
                        {account.displayName && <p className="truncate text-sm text-meta">{account.email}</p>}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${account.role === "manager" ? "bg-amber text-amber-ink" : "bg-tealbg text-tealdeep"}`}>
                        {account.role === "manager" ? (th ? "ผู้จัดการ" : "Manager") : (th ? "พนักงาน" : "Staff")}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink disabled:opacity-40"
                        disabled={busy || self}
                        onClick={() => updateAccount(account.id, { role: account.role === "manager" ? "staff" : "manager" })}
                      >
                        {account.role === "manager" ? (th ? "เปลี่ยนเป็นพนักงาน" : "Make staff") : (th ? "เลื่อนเป็นผู้จัดการ" : "Make manager")}
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-40 ${account.active ? "border border-danger/30 text-danger" : "bg-okbg text-ok"}`}
                        disabled={busy || self}
                        onClick={() => updateAccount(account.id, { active: !account.active })}
                      >
                        {account.active ? (th ? "ปิดใช้งาน" : "Deactivate") : (th ? "เปิดใช้งาน" : "Reactivate")}
                      </button>
                      <button type="button" className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink" onClick={() => setResetId(resetId === account.id ? null : account.id)}>
                        {th ? "ตั้งรหัสผ่านใหม่" : "Reset password"}
                      </button>
                    </div>

                    {resetId === account.id && (
                      <div className="mt-3 flex flex-col gap-2 rounded-xl bg-paper p-3 sm:flex-row">
                        <input
                          className="field flex-1"
                          type="password"
                          minLength={12}
                          placeholder={th ? "รหัสผ่านใหม่ 12 ตัวขึ้นไป" : "New password, 12+ characters"}
                          value={resetPassword}
                          onChange={(event) => setResetPassword(event.target.value)}
                        />
                        <button type="button" className="btn-primary sm:w-auto" disabled={busy || resetPassword.length < 12} onClick={() => submitReset(account.id)}>
                          {th ? "บันทึก" : "Save"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mb-3 block"><span className="mb-1 block text-sm font-semibold text-meta">{label}</span>{children}</label>;
}
