import type { Metadata } from "next";
import { SITE_URL } from "@/lib/landing/site";
import { LegalArticle } from "@/components/legal/LegalArticle";
import { html } from "@/content/legal/privacy.html";

export const metadata: Metadata = {
  title: "Privacy Policy | Siamese Cat Creative Club",
  description: "How Siamese Cat Creative Club collects, uses, stores, and protects parent and child information.",
  alternates: {
    canonical: `${SITE_URL}/EN/privacy`,
    languages: { th: `${SITE_URL}/privacy`, en: `${SITE_URL}/EN/privacy`, "x-default": `${SITE_URL}/privacy` },
  },
  robots: { index: true, follow: true },
};

export default function EnglishPrivacyPage() {
  return <LegalArticle html={html} language="en" path="/privacy" />;
}
