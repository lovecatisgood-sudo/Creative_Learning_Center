import type { Metadata } from "next";
import { dict } from "@/lib/i18n/dictionary";
import { SITE_URL } from "@/lib/landing/site";
import { LegalArticle } from "@/components/legal/LegalArticle";
import { html } from "@/content/legal/terms.html";

export const metadata: Metadata = {
  title: dict.termsPageTitle.th,
  description: dict.termsPageTitle.en,
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <LegalArticle html={html} />;
}
