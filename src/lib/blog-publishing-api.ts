import { timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, blogPosts } from "@/db/schema";
import { BlogValidationError, parseBlogPostInput } from "@/lib/blog";
import {
  BLOG_CATEGORIES,
  normalizeBlogSlug,
  type BlogCategory,
  type BlogLanguage,
  type BlogPostInput,
} from "@/lib/blog-shared";

const MAX_REQUEST_BYTES = 220_000;
const SITE_URL = "https://creative.siamesecat.cafe";

type PublishingStatus = "draft" | "published";

type PublishingPayload = {
  slug: string;
  category: BlogCategory;
  title: string;
  summary: string;
  bodyMarkdown: string;
  status: PublishingStatus;
  seoTitle?: string;
  seoDescription?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
};

export async function handleBlogPublishingRequest(request: Request, language: BlogLanguage) {
  const authError = authenticate(request);
  if (authError) return authError;

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return response({ error: "Content-Type must be application/json" }, 415);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return response({ error: "Request body is too large" }, 413);
  }

  try {
    const raw = await request.json().catch(() => {
      throw new PublishingApiError("Request body must be valid JSON", 400);
    });
    const payload = parsePublishingPayload(raw);
    const now = new Date();

    const result = await db.transaction(async (tx) => {
      // Serialize writes for one slug so simultaneous Thai/English cron calls
      // cannot race into competing inserts or overwrite the paired language.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${payload.slug}))`);
      const [existing] = await tx.select().from(blogPosts).where(eq(blogPosts.slug, payload.slug)).limit(1);

      if (existing && existing.category !== payload.category) {
        throw new PublishingApiError(
          `Slug already belongs to category '${existing.category}'`,
          409,
        );
      }

      const values = buildPostInput(payload, language, existing);
      const publishedAt = existing?.publishedAt ?? (payload.status === "published" ? now : null);
      const [post] = existing
        ? await tx
            .update(blogPosts)
            .set({ ...values, publishedAt, updatedAt: now })
            .where(eq(blogPosts.id, existing.id))
            .returning()
        : await tx
            .insert(blogPosts)
            .values({ ...values, publishedAt, updatedAt: now })
            .returning();

      await tx.insert(auditLog).values({
        action: existing ? "integration_blog_post_updated" : "integration_blog_post_created",
        entity: "blog_post",
        entityId: post.id,
        detail: {
          source: "blog_publishing_api",
          language,
          slug: post.slug,
          category: post.category,
          status: payload.status,
        },
      });

      return { post, created: !existing };
    });

    const prefix = language === "en" ? "/EN" : "";
    return response(
      {
        ok: true,
        action: result.created ? "created" : "updated",
        language,
        status: payload.status,
        post: {
          id: result.post.id,
          slug: result.post.slug,
          category: result.post.category,
          publicUrl: payload.status === "published" ? `${SITE_URL}${prefix}/blog/${result.post.slug}` : null,
          adminUrl: `${SITE_URL}/admin/blog/${result.post.id}`,
          publishedAt: result.post.publishedAt?.toISOString() ?? null,
          updatedAt: result.post.updatedAt.toISOString(),
        },
      },
      result.created ? 201 : 200,
    );
  } catch (error) {
    if (error instanceof PublishingApiError) return response({ error: error.message }, error.status);
    if (error instanceof BlogValidationError) return response({ error: error.message }, 422);
    if (isUniqueViolation(error)) return response({ error: "Slug is already in use" }, 409);
    console.error("Blog publishing integration failed", error);
    return response({ error: "Unable to save the blog post" }, 500);
  }
}

function authenticate(request: Request): NextResponse | null {
  const expected = process.env.BLOG_PUBLISH_API_KEY ?? "";
  if (expected.length < 32) {
    console.error("BLOG_PUBLISH_API_KEY is missing or shorter than 32 characters");
    return response({ error: "Blog publishing API is not configured" }, 503);
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match || !safeEqual(match[1], expected)) {
    return response(
      { error: "Unauthorized" },
      401,
      { "WWW-Authenticate": 'Bearer realm="blog-publishing"' },
    );
  }
  return null;
}

function parsePublishingPayload(value: unknown): PublishingPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PublishingApiError("Request body must be a JSON object", 400);
  }
  const raw = value as Record<string, unknown>;
  const slug = normalizeBlogSlug(raw.slug);
  const category = clean(raw.category) as BlogCategory;
  const status = clean(raw.status) as PublishingStatus;
  const title = clean(raw.title);
  const summary = clean(raw.summary);
  const bodyMarkdown = clean(raw.bodyMarkdown);

  if (!slug) throw new PublishingApiError("slug is required and must contain ASCII letters or numbers", 422);
  if (!BLOG_CATEGORIES.includes(category)) {
    throw new PublishingApiError(`category must be one of: ${BLOG_CATEGORIES.join(", ")}`, 422);
  }
  if (status !== "draft" && status !== "published") {
    throw new PublishingApiError("status must be 'draft' or 'published'", 422);
  }
  if (!title || !summary || !bodyMarkdown) {
    throw new PublishingApiError("title, summary and bodyMarkdown are required", 422);
  }

  return {
    slug,
    category,
    title,
    summary,
    bodyMarkdown,
    status,
    seoTitle: optionalText(raw.seoTitle),
    seoDescription: optionalText(raw.seoDescription),
    coverImageUrl: optionalText(raw.coverImageUrl),
    coverImageAlt: optionalText(raw.coverImageAlt),
  };
}

function buildPostInput(
  payload: PublishingPayload,
  language: BlogLanguage,
  existing: typeof blogPosts.$inferSelect | undefined,
): BlogPostInput {
  const base: BlogPostInput = {
    slug: payload.slug,
    category: payload.category,
    titleTh: existing?.titleTh ?? "",
    summaryTh: existing?.summaryTh ?? "",
    bodyTh: existing?.bodyTh ?? "",
    seoTitleTh: existing?.seoTitleTh ?? "",
    seoDescriptionTh: existing?.seoDescriptionTh ?? "",
    titleEn: existing?.titleEn ?? "",
    summaryEn: existing?.summaryEn ?? "",
    bodyEn: existing?.bodyEn ?? "",
    seoTitleEn: existing?.seoTitleEn ?? "",
    seoDescriptionEn: existing?.seoDescriptionEn ?? "",
    coverImageUrl: payload.coverImageUrl ?? existing?.coverImageUrl ?? "",
    coverImageAltTh: existing?.coverImageAltTh ?? "",
    coverImageAltEn: existing?.coverImageAltEn ?? "",
    publishedTh: existing?.publishedTh ?? false,
    publishedEn: existing?.publishedEn ?? false,
  };

  if (language === "th") {
    base.titleTh = payload.title;
    base.summaryTh = payload.summary;
    base.bodyTh = payload.bodyMarkdown;
    base.seoTitleTh = payload.seoTitle ?? base.seoTitleTh;
    base.seoDescriptionTh = payload.seoDescription ?? base.seoDescriptionTh;
    base.coverImageAltTh = payload.coverImageAlt ?? base.coverImageAltTh;
    base.publishedTh = payload.status === "published";
  } else {
    base.titleEn = payload.title;
    base.summaryEn = payload.summary;
    base.bodyEn = payload.bodyMarkdown;
    base.seoTitleEn = payload.seoTitle ?? base.seoTitleEn;
    base.seoDescriptionEn = payload.seoDescription ?? base.seoDescriptionEn;
    base.coverImageAltEn = payload.coverImageAlt ?? base.coverImageAltEn;
    base.publishedEn = payload.status === "published";
  }

  return parseBlogPostInput(base);
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function safeEqual(actual: string, expected: string): boolean {
  const actualValue = Buffer.from(actual);
  const expectedValue = Buffer.from(expected);
  const length = Math.max(actualValue.length, expectedValue.length);
  const actualBuffer = Buffer.alloc(length);
  const expectedBuffer = Buffer.alloc(length);
  actualValue.copy(actualBuffer);
  expectedValue.copy(expectedBuffer);
  return timingSafeEqual(actualBuffer, expectedBuffer) && actualValue.length === expectedValue.length;
}

function response(body: unknown, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      ...headers,
    },
  });
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}

class PublishingApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PublishingApiError";
  }
}
