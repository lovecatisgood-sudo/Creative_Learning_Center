"use client";

import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

export function BindEmailClient() {
  const th = !usePathname().startsWith("/EN/");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/member/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError(response?.status === 429 ? (th ? "ส่งคำขอมากเกินไป กรุณารอ 10 นาที" : "Too many requests. Please wait 10 minutes.") : (th ? "ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่" : "Unable to send email. Please try again."));
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-dvh flex-col bg-paper px-4 py-6 safe-top safe-bottom">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 text-center"><Logo size={68} alt="" /><h1 className="mt-3 text-2xl font-extrabold text-brown">{th ? "ผูกอีเมล" : "Bind your email"}</h1></div>
        {sent ? (
          <section role="status" className="rounded-2xl border border-teal bg-tealbg p-5 text-center">
            <h2 className="text-lg font-extrabold">{th ? "ตรวจสอบอีเมลของคุณ" : "Check your email"}</h2>
            <p className="mt-2 text-sm text-meta">{th ? "เปิดลิงก์ภายใน 20 นาทีเพื่อยืนยันบัญชี" : "Open the link within 20 minutes to verify your account."}</p>
            <a className="btn-ghost mt-4" href={th ? "/member" : "/EN/member"}>{th ? "กลับไปหน้าสมาชิก" : "Back to member dashboard"}</a>
          </section>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-line bg-card p-5">
            <p className="mb-4 text-sm text-meta">{th ? "ใช้อีเมลที่คุณเข้าถึงได้ เพื่อรักษาประวัติแพ็กเกจเมื่อเปลี่ยนอุปกรณ์" : "Use an email you can access so your package history remains available when you change devices."}</p>
            <label className="block text-sm font-bold text-meta" htmlFor="bind-email">{th ? "อีเมล" : "Email"}</label>
            <input id="bind-email" className="field mt-1" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
            <button className="btn-primary mt-4" disabled={busy}>{busy ? (th ? "กำลังส่ง…" : "Sending…") : (th ? "ส่งลิงก์ยืนยัน" : "Send verification link")}</button>
          </form>
        )}
      </div>
    </main>
  );
}
