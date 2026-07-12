"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";

type Result = { parentName: string; childNames: string[]; duplicatePhone?: boolean };

export default function SignupSuccessPage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("sccc_signup_result");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  const label = (th: string, en: string) => (lang === "th" ? `${th} / ${en}` : `${en} / ${th}`);

  return (
    <div className="flex min-h-screen flex-col bg-paper px-6 pb-10 pt-4">
      <div className="flex justify-end">
        <LangToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-okbg text-4xl text-ok">
          ✓
        </div>
        <h1 className="text-2xl font-extrabold text-ok">{label("ลงทะเบียนสำเร็จ", "Registration successful")}</h1>
        <p className="mt-2 text-base text-meta">{label("กรุณาแสดงหน้าจอนี้ให้พนักงาน", "Please show this screen to our staff")}</p>

        {result && (
          <div className="mt-6 w-full rounded-2xl border border-line bg-card p-5">
            <div className="text-[13px] font-semibold text-meta">{t("parentLabel")}</div>
            <div className="text-xl font-bold text-ink">{result.parentName}</div>
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
          </div>
        )}
      </div>

      <button
        onClick={() => {
          sessionStorage.removeItem("sccc_signup_result");
          router.push("/signup");
        }}
        className="btn-ghost mt-6"
      >
        {t("registerAnother")}
      </button>
    </div>
  );
}
