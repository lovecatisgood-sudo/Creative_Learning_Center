import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient } from "pg";

type SeriesItem = {
  draft: string;
  thaiBody: string;
  slug: string;
  category: "parenting-guides" | "kid-learning-material" | "club-news-updates" | "faq";
  publishedAt: string;
  coverImageUrl: string;
  coverImageAltEn: string;
  coverImageAltTh: string;
  titleTh: string;
  summaryTh: string;
  seoTitleTh: string;
  seoDescriptionTh: string;
};

type PublishablePost = SeriesItem & {
  titleEn: string;
  summaryEn: string;
  bodyEn: string;
  bodyTh: string;
  seoTitleEn: string;
  seoDescriptionEn: string;
};

const projectDir = process.cwd();
const seriesDir = path.join(projectDir, "content", "scheduled-blog-series");
const draftDir = path.join(projectDir, "docs", "content-drafts", "2026-08-27-ten-article-series");

function field(markdown: string, label: string): string {
  const match = markdown.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, "m"));
  assert(match, `Missing ${label}`);
  return match[1].trim();
}

function cleanEnglishDraft(markdown: string) {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  assert(title, "English draft is missing its H1 title");
  const bodyStart = markdown.search(/^\*\*Meta description:\*\*.+\n/m);
  assert(bodyStart >= 0, `Missing Meta description in ${title}`);
  const afterMeta = markdown.indexOf("\n", bodyStart) + 1;
  const notes = markdown.search(/^### Editorial evidence notes$/m);
  const body = markdown.slice(afterMeta, notes >= 0 ? notes : undefined).trim();
  return {
    titleEn: title,
    summaryEn: field(markdown, "Meta description"),
    bodyEn: body,
    seoTitleEn: field(markdown, "SEO title"),
    seoDescriptionEn: field(markdown, "Meta description"),
  };
}

async function loadSeries(): Promise<PublishablePost[]> {
  const manifest = JSON.parse(await readFile(path.join(seriesDir, "series.json"), "utf8")) as SeriesItem[];
  return Promise.all(manifest.map(async (item) => {
    const [draft, bodyTh] = await Promise.all([
      readFile(path.join(draftDir, item.draft), "utf8"),
      readFile(path.join(seriesDir, item.thaiBody), "utf8"),
    ]);
    return { ...item, ...cleanEnglishDraft(draft), bodyTh: bodyTh.trim() };
  }));
}

function validateSeries(posts: PublishablePost[]) {
  assert.equal(posts.length, 10, "The schedule must contain exactly ten bilingual posts");
  assert.equal(new Set(posts.map((post) => post.slug)).size, 10, "Every slug must be unique");
  const timestamps = posts.map((post) => new Date(post.publishedAt));
  assert(timestamps.every((date) => Number.isFinite(date.valueOf())), "Every publication timestamp must be valid");
  assert(timestamps.every((date, index) => index === 0 || date > timestamps[index - 1]), "Publication timestamps must increase");

  for (const post of posts) {
    assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert(post.bodyTh.length > 800, `${post.slug}: Thai body is unexpectedly short`);
    const englishWords = post.bodyEn.split(/\s+/).filter(Boolean).length;
    assert(englishWords <= 800, `${post.slug}: English article exceeds 800 words (${englishWords})`);
    assert(!/Editorial evidence notes|\*\*Status:|\*\*Suggested slug:|\*\*Primary query:/i.test(post.bodyEn), `${post.slug}: internal English notes leaked into the public body`);
    assert(!/Editorial evidence notes|สถานะ:|คำค้นหลัก:/i.test(post.bodyTh), `${post.slug}: internal Thai notes leaked into the public body`);
    assert(post.seoTitleEn.length <= 120 && post.seoTitleTh.length <= 120, `${post.slug}: SEO title is too long`);
    assert(post.seoDescriptionEn.length <= 320 && post.seoDescriptionTh.length <= 320, `${post.slug}: SEO description is too long`);
  }
}

const UPSERT_SQL = `
  insert into blog_posts (
    slug, category,
    title_th, summary_th, body_th, seo_title_th, seo_description_th,
    title_en, summary_en, body_en, seo_title_en, seo_description_en,
    cover_image_url, cover_image_alt_th, cover_image_alt_en,
    published_th, published_en, published_at, updated_at
  ) values (
    $1, $2,
    $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12,
    $13, $14, $15,
    true, true, $16, now()
  )
  on conflict (slug) do update set
    category = excluded.category,
    title_th = excluded.title_th,
    summary_th = excluded.summary_th,
    body_th = excluded.body_th,
    seo_title_th = excluded.seo_title_th,
    seo_description_th = excluded.seo_description_th,
    title_en = excluded.title_en,
    summary_en = excluded.summary_en,
    body_en = excluded.body_en,
    seo_title_en = excluded.seo_title_en,
    seo_description_en = excluded.seo_description_en,
    cover_image_url = excluded.cover_image_url,
    cover_image_alt_th = excluded.cover_image_alt_th,
    cover_image_alt_en = excluded.cover_image_alt_en,
    published_th = true,
    published_en = true,
    published_at = excluded.published_at,
    updated_at = now()
  returning id
`;

async function upsertPost(client: PoolClient, post: PublishablePost) {
  const values = [
    post.slug, post.category,
    post.titleTh, post.summaryTh, post.bodyTh, post.seoTitleTh, post.seoDescriptionTh,
    post.titleEn, post.summaryEn, post.bodyEn, post.seoTitleEn, post.seoDescriptionEn,
    post.coverImageUrl, post.coverImageAltTh, post.coverImageAltEn,
    new Date(post.publishedAt),
  ];
  const result = await client.query<{ id: number }>(UPSERT_SQL, values);
  await client.query(
    `insert into audit_log (admin_id, action, entity, entity_id, detail)
     values (null, 'blog_post_scheduled', 'blog_post', $1, $2::jsonb)`,
    [result.rows[0].id, JSON.stringify({ slug: post.slug, publishedAt: post.publishedAt, languages: ["th", "en"], source: "schedule-blog-series" })],
  );
}

function poolFromEnvironment() {
  const connectionString = process.env.DATABASE_URL;
  assert(connectionString, "DATABASE_URL is required for --apply or --verify");
  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    max: 2,
  });
}

async function applySeries(posts: PublishablePost[]) {
  assert.equal(process.env.CONFIRM_PRODUCTION_BLOG_SCHEDULE, "2026-08-28", "Set CONFIRM_PRODUCTION_BLOG_SCHEDULE=2026-08-28 to apply");
  assert(posts.every((post) => new Date(post.publishedAt) > new Date()), "Refusing to create a schedule containing a publication time that has already passed");
  const pool = poolFromEnvironment();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock($1)", [8272026]);
    for (const post of posts) await upsertPost(client, post);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function verifySeries(posts: PublishablePost[]) {
  const pool = poolFromEnvironment();
  try {
    const result = await pool.query<{
      slug: string;
      published_th: boolean;
      published_en: boolean;
      published_at: Date;
      title_th: string;
      title_en: string;
    }>(
      `select slug, published_th, published_en, published_at, title_th, title_en
       from blog_posts where slug = any($1::text[]) order by published_at`,
      [posts.map((post) => post.slug)],
    );
    assert.equal(result.rowCount, posts.length, "Not every scheduled post exists in the database");
    for (const post of posts) {
      const row = result.rows.find((candidate) => candidate.slug === post.slug);
      assert(row, `${post.slug}: missing database row`);
      assert(row.published_th && row.published_en, `${post.slug}: both language flags must be enabled`);
      assert.equal(row.published_at.toISOString(), post.publishedAt, `${post.slug}: wrong publication timestamp`);
      assert.equal(row.title_th, post.titleTh, `${post.slug}: wrong Thai title`);
      assert.equal(row.title_en, post.titleEn, `${post.slug}: wrong English title`);
    }
  } finally {
    await pool.end();
  }
}

function printSchedule(posts: PublishablePost[]) {
  const bangkok = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  });
  for (const [index, post] of posts.entries()) {
    console.log(`${index + 1}. ${bangkok.format(new Date(post.publishedAt))} — ${post.slug}`);
  }
}

async function main() {
  const mode = process.argv[2] ?? "--check";
  assert(["--check", "--apply", "--verify"].includes(mode), "Use --check, --apply or --verify");
  const posts = await loadSeries();
  validateSeries(posts);
  if (mode === "--apply") await applySeries(posts);
  if (mode === "--verify") await verifySeries(posts);
  printSchedule(posts);
  console.log(mode === "--apply" ? "Scheduled ten bilingual posts." : mode === "--verify" ? "Database schedule verified." : "Bilingual series validation passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
