"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dict, type DictKey, type Lang } from "@/lib/i18n/dictionary";
import { PublicLanguageLink } from "@/components/PublicLanguageLink";

type Result = { parentName: string; memberUid: string | null; childNames: string[]; duplicatePhone?: boolean; membershipConnection?: "linked" | "pending" | "skipped" };

function SignupSuccessPageContent({ language }: { language: Lang }) {
  const lang = language;
  const t = (key: DictKey) => dict[key][lang];
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<"linked" | "pending" | "skipped" | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("sccc_signup_result");
    if (raw) {
      const parsed = JSON.parse(raw) as Result;
      setResult(parsed);
      setMembershipStatus(parsed.membershipConnection ?? null);
    }
    const status = new URLSearchParams(window.location.search).get("membership");
    if (status === "linked" || status === "pending" || status === "skipped") setMembershipStatus(status);
  }, []);

  const label = (th: string, en: string) => (lang === "th" ? th : en);
  const homeUrl = lang === "en" ? "/EN" : "/";

  return (
    <div className="flex min-h-screen flex-col bg-paper px-6 pb-10 pt-4">
      <div className="flex justify-end">
        <PublicLanguageLink language={lang} path="/signup/success" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-okbg text-4xl text-ok">
          ✓
        </div>
        <h1 className="text-2xl font-extrabold text-ok">{label("ลงทะเบียนสำเร็จ", "Registration complete")}</h1>
        <p className="mt-2 text-base text-meta">{result?.memberUid ? label("แสดงรหัสสมาชิกนี้ให้พนักงาน", "Show this Member ID to our staff") : label("ทีมงานได้รับข้อมูลผู้ปกครองและบุตรแล้ว", "Your parent and child details have been saved")}</p>

        {result && (
          <div className="mt-6 w-full rounded-2xl border border-line bg-card p-5">
            <div className="text-[13px] font-semibold text-meta">{t("parentLabel")}</div>
            <div className="text-xl font-bold text-ink">{result.parentName}</div>
            {result.memberUid && <><div className="mt-4 text-[13px] font-semibold text-meta">Siamese Cat Member ID</div><div className="mt-1 break-all font-mono text-2xl font-extrabold tracking-wide text-brown">{result.memberUid}</div></>}
            <div className="mt-3 text-[13px] font-semibold text-meta">{t("childSection")}</div>
            <div className="flex flex-col gap-1">
              {result.childNames.map((n, i) => (
                <div key={i} className="text-xl font-bold text-ink">
                  {n}
                </div>
              ))}
            </div>
            {result.duplicatePhone && (
              <p className="mt-4 rounded-lg bg-warnbg px-3 py-2 text-[13px] font-semibold text-warn">
                {t("duplicatePhoneWarn")}
              </p>
            )}
            {membershipStatus === "linked" && <p className="mt-4 rounded-lg bg-okbg px-3 py-2 text-[13px] font-semibold text-ok">{label("เชื่อมต่อ Siamese Cat Member แล้ว", "Siamese Cat Member connected")}</p>}
            {membershipStatus === "pending" && <div className="mt-4 rounded-lg bg-warnbg px-3 py-2 text-[13px] font-semibold text-warn"><p>{label("บันทึกการลงทะเบียนแล้ว แต่ยังเชื่อมต่อสมาชิกไม่สำเร็จ", "Registration is saved, but membership is not connected yet.")}</p><a className="mt-2 inline-block underline" href="/api/public/member/connect/start">{label("ลองเชื่อมต่ออีกครั้ง", "Retry connection")}</a></div>}
            {membershipStatus === "skipped" && <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-[13px] text-meta">{label("ไม่ได้เชื่อมต่อสมาชิก คุณสามารถเชื่อมต่อภายหลังจากโปรไฟล์", "Membership was skipped. You can connect later from your profile.")}</p>}
          </div>
        )}
      </div>

      {result?.memberUid && (
        <button onClick={() => router.push(lang === "en" ? "/EN/member" : "/member")} className="btn-primary mt-6">
          {label("ดูแพ็กเกจของฉัน", "View my packages")}
        </button>
      )}

      <button
        onClick={() => {
          sessionStorage.removeItem("sccc_signup_result");
          router.push(homeUrl);
        }}
        className="btn-ghost mt-6"
      >
        {label("กลับไปที่ Creative Club", "Back to Creative Club")}
      </button>
    </div>
  );
}

export default function SignupSuccessPage() {
  const pathname = usePathname();
  return <SignupSuccessPageContent language={pathname.startsWith("/EN/") ? "en" : "th"} />;
}
