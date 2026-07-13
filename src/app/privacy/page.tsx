import type { Metadata } from "next";
import { dict } from "@/lib/i18n/dictionary";
import { SITE_URL } from "@/lib/landing/site";
import { LegalArticle } from "@/components/legal/LegalArticle";
import { html } from "@/content/legal/privacy.html";

export const metadata: Metadata = {
  title: dict.privacyPageTitle.th,
  description: dict.privacyPageTitle.en,
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <LegalArticle html={html} />;
}
