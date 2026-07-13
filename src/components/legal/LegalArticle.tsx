"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/components/LangToggle";
import { Logo } from "@/components/Logo";

// Shared chrome for the public /terms and /privacy pages. The policy BODY
// (`html`) is the owner's English legal text and is never translated; only the
// surrounding chrome (header, back link, "Thai coming" note) goes through t().
// Rendered from a server page that imports the generated `html` string.
export function LegalArticle({ html }: { html: string }) {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-3 px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={34} />
            <b className="text-[15px] font-extrabold text-brown">{t("shopName")}</b>
          </Link>
          <LangToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-tealdeep"
        >
          <span aria-hidden>←</span> {t("legalBackToHome")}
        </Link>

        <p className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-[13px] font-medium text-meta">
          {t("legalThaiNote")}
        </p>

        <article
          className="legal-prose mt-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </div>
  );
}
