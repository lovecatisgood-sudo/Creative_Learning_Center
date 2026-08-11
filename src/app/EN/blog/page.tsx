import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { SITE_URL } from "@/lib/landing/site";

export const revalidate = 300;

const title = "Bangna Family Guide: Play & After School | Siamese Cat";
const description = "Practical answers about Kids Playroom visits, after-school routines, play and family activities around Bangna and Mega Bangna.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/EN/blog`, languages: { th: `${SITE_URL}/blog`, en: `${SITE_URL}/EN/blog`, "x-default": `${SITE_URL}/blog` } },
  openGraph: { type: "website", title, description, url: `${SITE_URL}/EN/blog`, locale: "en_US", alternateLocale: ["th_TH"], images: ["/landing/og-siamese-cat-creative-club.jpg"] },
  twitter: { card: "summary_large_image", title, description, images: ["/landing/og-siamese-cat-creative-club.jpg"] },
};

export default async function EnglishBlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return <BlogIndex language="en" category={category} />;
}
