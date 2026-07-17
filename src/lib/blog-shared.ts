export const BLOG_CATEGORIES = [
  "parenting-guides",
  "kid-learning-material",
  "club-news-updates",
  "faq",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
export type BlogLanguage = "th" | "en";

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, { th: string; en: string }> = {
  "parenting-guides": { th: "คู่มือสำหรับผู้ปกครอง", en: "Parenting Guides" },
  "kid-learning-material": { th: "สื่อการเรียนรู้สำหรับเด็ก", en: "Kid Learning Material" },
  "club-news-updates": { th: "ข่าวสารและอัปเดตจากคลับ", en: "Club News & Updates" },
  faq: { th: "คำถามที่พบบ่อย", en: "FAQ" },
};

export type BlogPostInput = {
  slug: string;
  category: BlogCategory;
  titleTh: string;
  summaryTh: string;
  bodyTh: string;
  seoTitleTh: string;
  seoDescriptionTh: string;
  titleEn: string;
  summaryEn: string;
  bodyEn: string;
  seoTitleEn: string;
  seoDescriptionEn: string;
  coverImageUrl: string;
  coverImageAltTh: string;
  coverImageAltEn: string;
  publishedTh: boolean;
  publishedEn: boolean;
};

export function normalizeBlogSlug(value: unknown): string {
  return (typeof value === "string" ? value.trim() : "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}
