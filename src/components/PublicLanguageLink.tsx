"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/dictionary";

function counterpartPath(path: string, language: Lang): string {
  if (language === "th") return path === "/" ? "/EN" : `/EN${path}`;
  return path;
}

export function PublicLanguageLink({
  language,
  path,
  dark = false,
}: {
  language: Lang;
  path: string;
  dark?: boolean;
}) {
  const baseHref = counterpartPath(path, language);
  const [href, setHref] = useState(baseHref);

  useEffect(() => {
    setHref(`${baseHref}${window.location.search}${window.location.hash}`);
  }, [baseHref]);

  return (
    <Link
      href={href}
      hrefLang={language === "th" ? "en" : "th"}
      aria-label={language === "th" ? "English - เปลี่ยนเป็นภาษาอังกฤษ" : "ไทย - Switch to Thai"}
      className={
        "inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 text-[13px] font-bold " +
        (dark ? "border-cream/40 text-cream" : "border-line bg-card text-ink")
      }
    >
      {language === "th" ? "English" : "ไทย"}
    </Link>
  );
}
