"use client";

import Link from "next/link";
import type { Lang } from "@/lib/i18n/dictionary";
import { PublicLanguageLink } from "@/components/PublicLanguageLink";
import { Logo } from "@/components/Logo";

export function LegalArticle({ html, language, path }: { html: string; language: Lang; path: string }) {
  const homeUrl = language === "en" ? "/EN/" : "/";
  const backLabel = language === "th" ? "กลับหน้าหลัก" : "Back to home";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-3 px-5 py-3">
          <Link href={homeUrl} className="flex items-center gap-2.5">
            <Logo size={34} alt="" />
            <b className="text-[15px] font-extrabold text-brown">Siamese Cat Creative Club</b>
          </Link>
          <PublicLanguageLink language={language} path={path} />
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-6">
        <Link
          href={homeUrl}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-tealdeep"
        >
          <span aria-hidden>←</span> {backLabel}
        </Link>

        <article
          className="legal-prose mt-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-10 border-t border-line pt-6">
          <Link
            href={homeUrl}
            className="inline-flex min-h-[44px] items-center gap-1.5 font-bold text-tealdeep underline decoration-2 underline-offset-4"
          >
            <span aria-hidden>←</span> {backLabel}
          </Link>
        </div>
      </main>
    </div>
  );
}
