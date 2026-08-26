"use client";

import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

export function MemberSignInClient() {
  const th = !usePathname().startsWith("/EN/");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/public/member/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("MEMBER_SIGNIN_REQUEST_FAILED");
      setSent(true);
    } catch {
      setError(th
        ? "ยังส่งลิงก์ไม่ได้ในขณะนี้ โปรดลองอีกครั้งในอีกสักครู่"
        : "We could not send the link right now. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-paper px-4 py-6 safe-top safe-bottom">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 text-center">
          <Logo size={82} alt="Siamese Cat Member" />
          <h1 className="mt-3 text-2xl font-extrabold text-brown">Siamese Cat Member</h1>
          <p className="mt-1 text-sm text-meta">{th ? "ดูแพ็กเกจ เซสชัน และประวัติของคุณ" : "View your packages, sessions, and history"}</p>
        </div>
        {sent ? (
          <section role="status" className="rounded-2xl border border-teal bg-tealbg p-5 text-center">
            <h2 className="text-lg font-extrabold">{th ? "ตรวจสอบอีเมลของคุณ" : "Check your email"}</h2>
            <p className="mt-2 text-sm text-meta">
              {th ? "หากอีเมลนี้ผูกกับสมาชิก เราได้ส่งลิงก์เข้าสู่ระบบแล้ว" : "If this email is bound to a member, we sent a sign-in link."}
            </p>
            <button type="button" className="btn-ghost mt-4" onClick={() => setSent(false)}>{th ? "ใช้อีเมลอื่น" : "Use another email"}</button>
          </section>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-line bg-card p-5">
            <label className="block text-sm font-bold text-meta" htmlFor="member-email">{th ? "อีเมลที่ยืนยันแล้ว" : "Verified email"}</label>
            <input id="member-email" className="field mt-1" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <button className="btn-primary mt-4" disabled={busy}>{busy ? (th ? "กำลังส่ง…" : "Sending…") : (th ? "ส่งลิงก์เข้าสู่ระบบ" : "Email me a sign-in link")}</button>
            {error ? <p role="alert" className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
          </form>
        )}
        <a href={th ? "/signup" : "/EN/signup"} className="mt-4 text-center text-sm font-bold text-tealdeep underline">{th ? "ยังไม่มีรหัสสมาชิก? สมัครสมาชิก" : "No Member ID yet? Register"}</a>
      </div>
    </main>
  );
}
