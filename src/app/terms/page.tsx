import type { Metadata } from "next";
import { SITE_URL } from "@/lib/landing/site";
import { LegalArticle } from "@/components/legal/LegalArticle";
import { html } from "@/content/legal/terms.html";

export const metadata: Metadata = {
  title: "Terms of Service | Siamese Cat Creative Club",
  description: "Terms for Little Explorer Playgroup, After School Explorer, packages, passes, meal care, bookings, safety, and pickup.",
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <LegalArticle html={html} />;
}
