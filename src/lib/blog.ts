import { and, desc, eq } from "drizzle-orm";
import { marked } from "marked";
import { db } from "@/db";
import { blogPosts, type BlogPost } from "@/db/schema";
import {
  BLOG_CATEGORIES,
  normalizeBlogSlug,
  type BlogCategory,
  type BlogLanguage,
  type BlogPostInput,
} from "@/lib/blog-shared";

export { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS, normalizeBlogSlug } from "@/lib/blog-shared";
export type { BlogCategory, BlogLanguage, BlogPostInput } from "@/lib/blog-shared";

const FIELD_LIMITS: Partial<Record<keyof BlogPostInput, number>> = {
  slug: 90,
  titleTh: 160,
  titleEn: 160,
  summaryTh: 420,
  summaryEn: 420,
  bodyTh: 100_000,
  bodyEn: 100_000,
  seoTitleTh: 120,
  seoTitleEn: 120,
  seoDescriptionTh: 320,
  seoDescriptionEn: 320,
  coverImageUrl: 2_000,
  coverImageAltTh: 240,
  coverImageAltEn: 240,
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseBlogPostInput(value: unknown): BlogPostInput {
  if (!value || typeof value !== "object") throw new BlogValidationError("Invalid post data");
  const raw = value as Record<string, unknown>;
  const category = clean(raw.category) as BlogCategory;
  if (!BLOG_CATEGORIES.includes(category)) throw new BlogValidationError("Choose a valid category");

  const result: BlogPostInput = {
    slug: normalizeBlogSlug(raw.slug),
    category,
    titleTh: clean(raw.titleTh),
    summaryTh: clean(raw.summaryTh),
    bodyTh: clean(raw.bodyTh),
    seoTitleTh: clean(raw.seoTitleTh),
    seoDescriptionTh: clean(raw.seoDescriptionTh),
    titleEn: clean(raw.titleEn),
    summaryEn: clean(raw.summaryEn),
    bodyEn: clean(raw.bodyEn),
    seoTitleEn: clean(raw.seoTitleEn),
    seoDescriptionEn: clean(raw.seoDescriptionEn),
    coverImageUrl: clean(raw.coverImageUrl),
    coverImageAltTh: clean(raw.coverImageAltTh),
    coverImageAltEn: clean(raw.coverImageAltEn),
    publishedTh: raw.publishedTh === true,
    publishedEn: raw.publishedEn === true,
  };

  if (!result.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug)) {
    throw new BlogValidationError("Enter a URL slug using letters, numbers and hyphens");
  }
  if (!result.titleTh && !result.titleEn) throw new BlogValidationError("Add a title in Thai or English");

  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (String(result[field as keyof BlogPostInput] ?? "").length > limit) {
      throw new BlogValidationError(`${field} is too long`);
    }
  }

  if (result.coverImageUrl && !isSafePublicUrl(result.coverImageUrl)) {
    throw new BlogValidationError("Cover image must use HTTPS or a site-relative path");
  }
  if (result.publishedTh && (!result.titleTh || !result.summaryTh || !result.bodyTh)) {
    throw new BlogValidationError("Thai title, summary and article are required before publishing Thai");
  }
  if (result.publishedEn && (!result.titleEn || !result.summaryEn || !result.bodyEn)) {
    throw new BlogValidationError("English title, summary and article are required before publishing English");
  }

  return result;
}

export class BlogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlogValidationError";
  }
}

export async function getPublishedBlogPosts(language: BlogLanguage, category?: BlogCategory) {
  const publishedColumn = language === "th" ? blogPosts.publishedTh : blogPosts.publishedEn;
  const filters = category
    ? and(eq(publishedColumn, true), eq(blogPosts.category, category))
    : eq(publishedColumn, true);
  return db.select().from(blogPosts).where(filters).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.updatedAt));
}

export async function getPublishedBlogPost(slug: string, language: BlogLanguage): Promise<BlogPost | null> {
  const publishedColumn = language === "th" ? blogPosts.publishedTh : blogPosts.publishedEn;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(publishedColumn, true)))
    .limit(1);
  return post ?? null;
}

export function localizedPost(post: BlogPost, language: BlogLanguage) {
  return language === "th"
    ? {
        title: post.titleTh,
        summary: post.summaryTh,
        body: post.bodyTh,
        seoTitle: post.seoTitleTh,
        seoDescription: post.seoDescriptionTh,
        coverImageAlt: post.coverImageAltTh,
      }
    : {
        title: post.titleEn,
        summary: post.summaryEn,
        body: post.bodyEn,
        seoTitle: post.seoTitleEn,
        seoDescription: post.seoDescriptionEn,
        coverImageAlt: post.coverImageAltEn,
      };
}

export function renderBlogMarkdown(markdown: string): string {
  const renderer = new marked.Renderer();
  renderer.html = (html) => escapeHtml(html);
  renderer.link = (href, title, text) => {
    if (!isSafePublicUrl(href, true)) return text;
    const external = href.startsWith("https://");
    return `<a href="${escapeAttribute(href)}"${title ? ` title="${escapeAttribute(title)}"` : ""}${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
  };
  renderer.image = (href, title, text) => {
    if (!isSafePublicUrl(href)) return "";
    return `<img src="${escapeAttribute(href)}" alt="${escapeAttribute(text)}"${title ? ` title="${escapeAttribute(title)}"` : ""} loading="lazy" decoding="async">`;
  };
  return marked.parse(markdown, { async: false, gfm: true, renderer }) as string;
}

function isSafePublicUrl(value: string, allowContactLinks = false): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return true;
  if (value.startsWith("https://")) return true;
  return allowContactLinks && (value.startsWith("mailto:") || value.startsWith("tel:"));
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
