import { and, desc, eq } from "drizzle-orm";
import { marked } from "marked";
import { db } from "@/db";
import { blogPosts, type BlogPost } from "@/db/schema";
import { publishedBlogVisibilityFilter } from "@/lib/blog-publication";
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
    bodyTh: normalizeArticleBody(clean(raw.bodyTh)),
    seoTitleTh: clean(raw.seoTitleTh),
    seoDescriptionTh: clean(raw.seoDescriptionTh),
    titleEn: clean(raw.titleEn),
    summaryEn: clean(raw.summaryEn),
    bodyEn: normalizeArticleBody(clean(raw.bodyEn)),
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
  if ((result.publishedTh && /\[(?:VERIFY|ตรวจสอบ)[^\]]*\]/i.test(result.bodyTh)) || (result.publishedEn && /\[VERIFY[^\]]*\]/i.test(result.bodyEn))) {
    throw new BlogValidationError("Resolve every verification marker before publishing");
  }

  return result;
}

function normalizeArticleBody(value: string): string {
  return value.replace(/^\s*#\s+[^\n]+\n+/, "").replace(/^#\s+/gm, "## ").trim();
}

export class BlogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlogValidationError";
  }
}

export async function getPublishedBlogPosts(language: BlogLanguage, category?: BlogCategory) {
  const publishedColumn = language === "th" ? blogPosts.publishedTh : blogPosts.publishedEn;
  const visibilityFilter = publishedBlogVisibilityFilter(publishedColumn);
  const filters = category
    ? and(visibilityFilter, eq(blogPosts.category, category))
    : visibilityFilter;
  return db.select().from(blogPosts).where(filters).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.updatedAt));
}

export async function getPublishedBlogPost(slug: string, language: BlogLanguage): Promise<BlogPost | null> {
  const publishedColumn = language === "th" ? blogPosts.publishedTh : blogPosts.publishedEn;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), publishedBlogVisibilityFilter(publishedColumn)))
    .limit(1);
  return post ?? null;
}

export function localizedPost(post: BlogPost, language: BlogLanguage) {
  const base = language === "th"
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
  const override = BLOG_EDITORIAL_OVERRIDES[post.slug]?.[language];
  return override ? { ...base, ...override, seoTitle: override.title, seoDescription: override.summary } : base;
}

const BLOG_EDITORIAL_OVERRIDES: Record<string, Partial<Record<BlogLanguage, { title: string; summary: string }>>> = {
  "sleep-routines-and-child-behavior": {
    th: { title: "ลูกนอนดึก แล้ววันต่อมากลายเป็นคนละคน? วางกิจวัตรอย่างไรให้ทำได้จริง", summary: "แนวทางจัดช่วงเย็นและเวลาเข้านอนแบบไม่ทำให้บ้านกลายเป็นสนามรบ พร้อมแยกสิ่งที่แหล่งสุขภาพแนะนำออกจากประสบการณ์ในกิจวัตรเด็ก" },
    en: { title: "Late Night, Different Child Tomorrow? A Bedtime Routine Families Can Keep", summary: "A practical way to shape evenings without turning bedtime into a battle, with clear separation between health guidance and everyday routine choices." },
  },
  "easy-thai-recipes-for-kids-under-3": {
    th: { title: "ทำอาหารไทยให้เด็กเล็กอย่างไรให้ง่าย ปลอดภัย และไม่ต้องทำแยกทั้งครัว", summary: "ห้าแนวทางมื้ออาหารที่ปรับเนื้อสัมผัสและรสชาติได้ พร้อมข้อควรตรวจสอบเรื่องการแพ้และความพร้อมของเด็กก่อนเสิร์ฟ" },
    en: { title: "Thai Food for Young Children Without Cooking a Separate Menu", summary: "Five adaptable meal ideas, with texture, allergy and readiness checks parents should make before serving children under three." },
  },
  "learning-materials-for-6-year-olds-primary-transition-confidence": {
    th: { title: "ก่อนขึ้นประถม ลูก 6 ขวบต้องมีแบบฝึกเพิ่ม หรือควรฝึกให้ทำอะไรด้วยตัวเอง?", summary: "เลือกสื่อและกิจวัตรที่ช่วยเรื่องการอ่าน การจัดของ และความมั่นใจ โดยไม่เพิ่มชั่วโมงเรียนจนแน่นเกินไป" },
    en: { title: "Before Primary School: More Worksheets or More Independence?", summary: "Choose materials and routines that support reading, organization and confidence without filling every free hour with lessons." },
  },
  "learning-materials-for-5-year-olds-school-readiness-without-pressure": {
    th: { title: "ลูก 5 ขวบต้องเรียนเพิ่มจริงไหม? เตรียมเข้าโรงเรียนโดยไม่เปลี่ยนบ้านเป็นห้องเรียน", summary: "ไอเดียเตรียมความพร้อมผ่านนิทาน การเล่น และงานเล็ก ๆ ในชีวิตประจำวัน แทนการเร่งแบบฝึกทุกเย็น" },
    en: { title: "Does a Five-Year-Old Need More Lessons Before School?", summary: "Build school readiness through stories, play and small everyday responsibilities without turning home into another classroom." },
  },
  "learning-materials-for-4-year-olds-patterns-stories-fine-motor": {
    th: { title: "เด็ก 4 ขวบเรียนรู้จากอะไรได้มากกว่าใบงาน? ลองเริ่มจากเรื่องเล่า ลวดลาย และมือที่ได้ทำ", summary: "กิจกรรมง่าย ๆ ที่ให้เด็กเล่าเรื่อง จัดหมวด วาด ปั้น และสร้าง โดยปรับความยากจากสิ่งที่เด็กทำได้จริง" },
    en: { title: "What Can a Four-Year-Old Learn Without Another Worksheet?", summary: "Use stories, patterns, drawing, clay and building to adjust challenge around what the child can actually do." },
  },
  "learning-materials-for-3-year-olds-play-language-movement": {
    th: { title: "เด็ก 3 ขวบไม่ต้องนั่งโต๊ะนานก็เรียนรู้ได้: ภาษา การเคลื่อนไหว และการเล่น", summary: "เลือกสื่อที่ชวนพูด ขยับ จับคู่ และเล่นสมมติ พร้อมสัญญาณว่ากิจกรรมอาจยากหรือนานเกินไป" },
    en: { title: "Three-Year-Olds Can Learn Without Sitting Still", summary: "Choose materials that invite talking, movement, matching and pretend play, and notice when an activity is too difficult or too long." },
  },
  "reading-routine-for-early-childhood-development": {
    th: { title: "อ่านนิทานวันละกี่นาทีถึงจะพอดี? เริ่มจากกิจวัตรที่บ้านทำต่อได้", summary: "วิธีสร้างช่วงอ่านหนังสือสั้น ๆ ที่เด็กอยากกลับมาเอง พร้อมไอเดียเลือกเวลา หนังสือ และคำถามที่ไม่กลายเป็นการสอบ" },
    en: { title: "How Long Should Story Time Be? Start With a Routine You Can Keep", summary: "Create a short reading habit children want to return to, with timing, book and question choices that do not feel like a test." },
  },
  "calm-bedtime-routine-toddlers-preschoolers": {
    th: { title: "ก่อนนอนยิ่งเตือนยิ่งตื่น? ลดขั้นตอนให้เด็กเล็กค่อย ๆ สงบลง", summary: "จัดลำดับช่วงก่อนนอนให้สั้น คาดเดาได้ และเหมาะกับบ้านจริง โดยไม่อ้างว่ามีสูตรเดียวสำหรับเด็กทุกคน" },
    en: { title: "More Bedtime Reminders, More Energy? Simplify the Routine", summary: "Build a short, predictable wind-down that fits real family life without pretending one formula works for every child." },
  },
  "healthy-screen-habits-for-young-children": {
    th: { title: "ปิดจอแล้วทำอะไรต่อ? วางกิจวัตรที่ไม่จบด้วยการต่อรองทุกครั้ง", summary: "เปลี่ยนจากกฎเวลาจอแบบลอย ๆ เป็นจังหวะก่อนและหลังจอที่ชัดเจน พร้อมกิจกรรมต่อเนื่องที่เตรียมไว้ได้จริง" },
    en: { title: "The Screen Is Off. What Happens Next?", summary: "Turn vague screen-time rules into a clear before-and-after routine with realistic activities ready for the transition." },
  },
  "building-emotional-regulation-in-children": {
    th: { title: "ตอนลูกอารมณ์แรง เป้าหมายแรกไม่ใช่ให้หยุดร้อง แต่คือช่วยให้กลับมารู้สึกปลอดภัย", summary: "มองการสงบอารมณ์เป็นขั้นตอน ไม่ใช่คำสั่ง พร้อมภาษาง่าย ๆ ที่ผู้ใหญ่ใช้ได้เมื่อเด็กยังไม่พร้อมฟังเหตุผลยาว" },
    en: { title: "When Emotions Run High, Stopping the Cry Is Not the First Goal", summary: "Treat calming down as a process, not a command, with simple language adults can use before a child is ready for a long explanation." },
  },
};

export function renderBlogMarkdown(markdown: string): string {
  // The article template owns the single page H1. Legacy posts may still carry
  // a Markdown title, so strip the first one and demote any later H1 safely.
  const normalizedMarkdown = markdown
    .replace(/^\s*#\s+[^\n]+\n+/, "")
    .replace(/^#\s+/gm, "## ");
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
  return marked.parse(normalizedMarkdown, { async: false, gfm: true, renderer }) as string;
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
