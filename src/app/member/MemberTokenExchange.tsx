"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export function MemberTokenExchange({ kind }: { kind: "claim" | "verify" }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    // Remove the secret from browser history immediately, before any further
    // navigation or user action can copy/share it.
    history.replaceState(null, "", window.location.pathname);
    if (!token) {
      setFailed(true);
      return;
    }
    fetch(`/api/public/member/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((body) => {
        router.replace(body.language === "en" ? "/EN/member" : "/member");
        router.refresh();
      })
      .catch(() => setFailed(true));
  }, [kind, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper p-4 safe-top safe-bottom">
      <section className="w-full max-w-sm rounded-2xl border border-line bg-card p-6 text-center">
        <Logo size={72} alt="" />
        {failed ? (
          <><h1 className="mt-4 text-xl font-extrabold text-danger">Link invalid or expired</h1><p className="mt-2 text-sm text-meta">ลิงก์ไม่ถูกต้องหรือหมดอายุ · Ask staff for a new access QR or request another email.</p><a href="/member/sign-in" className="btn-primary mt-4">Member sign in</a></>
        ) : (
          <><h1 className="mt-4 text-xl font-extrabold text-brown">Siamese Cat Member</h1><p className="mt-2 text-sm text-meta">กำลังตรวจสอบลิงก์… · Checking your secure link…</p></>
        )}
      </section>
    </main>
  );
}
