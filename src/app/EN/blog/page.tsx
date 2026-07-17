import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { SITE_URL } from "@/lib/landing/site";

export const dynamic = "force-dynamic";

const title = "Family Blog | Siamese Cat Creative Club";
const description = "Parenting guides, kid learning material, club news and frequently asked questions from Siamese Cat Creative Club.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/EN/blog`, languages: { th: `${SITE_URL}/blog`, en: `${SITE_URL}/EN/blog`, "x-default": `${SITE_URL}/blog` } },
  openGraph: { type: "website", title, description, url: `${SITE_URL}/EN/blog`, locale: "en_US", alternateLocale: ["th_TH"], images: ["/landing/og-siamese-cat-creative-club.jpg"] },
  twitter: { card: "summary_large_image", title, description, images: ["/landing/og-siamese-cat-creative-club.jpg"] },
};

export default function EnglishBlogPage({ searchParams }: { searchParams: { category?: string } }) {
  return <BlogIndex language="en" category={searchParams.category} />;
}
