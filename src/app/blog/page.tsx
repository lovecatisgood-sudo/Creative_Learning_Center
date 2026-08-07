import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { SITE_URL } from "@/lib/landing/site";

export const revalidate = 300;

const title = "เรื่องครอบครัวบางนา การเล่น และหลังเลิกเรียน | Siamese Cat";
const description = "คำตอบจากพื้นที่จริงเรื่องเพลย์กรุ๊ป ชีวิตหลังเลิกเรียน การเล่น และกิจกรรมสำหรับครอบครัวย่านบางนา ใกล้เมกาบางนา";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/blog`, languages: { th: `${SITE_URL}/blog`, en: `${SITE_URL}/EN/blog`, "x-default": `${SITE_URL}/blog` } },
  openGraph: { type: "website", title, description, url: `${SITE_URL}/blog`, locale: "th_TH", alternateLocale: ["en_US"], images: ["/landing/og-siamese-cat-creative-club.jpg"] },
  twitter: { card: "summary_large_image", title, description, images: ["/landing/og-siamese-cat-creative-club.jpg"] },
};

export default async function ThaiBlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return <BlogIndex language="th" category={category} />;
}
