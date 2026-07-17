import type { Metadata } from "next";
import { SITE_URL } from "@/lib/landing/site";
import { LegalArticle } from "@/components/legal/LegalArticle";
import { html } from "@/content/legal/terms.th.html";

export const metadata: Metadata = {
  title: "ข้อกำหนดการให้บริการ | Siamese Cat Creative Club",
  description: "ข้อกำหนดสำหรับ Little Explorer Playgroup, After School Explorer, แพ็กเกจ การจอง ความปลอดภัย และการรับกลับ",
  alternates: {
    canonical: `${SITE_URL}/terms`,
    languages: { th: `${SITE_URL}/terms`, en: `${SITE_URL}/EN/terms`, "x-default": `${SITE_URL}/terms` },
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <LegalArticle html={html} language="th" path="/terms" />;
}
