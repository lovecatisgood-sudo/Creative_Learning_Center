import type { Metadata } from "next";
import { SITE_URL } from "@/lib/landing/site";
import { LegalArticle } from "@/components/legal/LegalArticle";
import { html } from "@/content/legal/privacy.th.html";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | Siamese Cat Creative Club",
  description: "วิธีที่ Siamese Cat Creative Club เก็บรวบรวม ใช้ จัดเก็บ และคุ้มครองข้อมูลของผู้ปกครองและเด็ก",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
    languages: { th: `${SITE_URL}/privacy`, en: `${SITE_URL}/EN/privacy`, "x-default": `${SITE_URL}/privacy` },
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <LegalArticle html={html} language="th" path="/privacy" />;
}
