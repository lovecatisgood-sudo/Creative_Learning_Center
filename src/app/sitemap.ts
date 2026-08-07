import type { MetadataRoute } from "next";
import { getPublishedBlogPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/landing/site";

export const dynamic = "force-dynamic";

const routes = [
  { path: "", changeFrequency: "monthly", priority: 1 },
  { path: "/inside", changeFrequency: "monthly", priority: 0.8 },
  { path: "/playgroup", changeFrequency: "monthly", priority: 0.8 },
  { path: "/creative", changeFrequency: "monthly", priority: 0.8 },
  { path: "/little-explorer-program", changeFrequency: "monthly", priority: 0.8 },
  { path: "/membership", changeFrequency: "monthly", priority: 0.8 },
  { path: "/dinner", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/first-visit", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/editorial-process", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
] as const;

const LAST_UPDATED = new Date("2026-08-08T00:00:00+07:00");
const GAME_LAST_UPDATED = new Date("2026-08-02T00:00:00+07:00");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = routes.flatMap(({ path, changeFrequency, priority }) => {
    const thaiUrl = `${SITE_URL}${path || "/"}`;
    const englishUrl = `${SITE_URL}/EN${path}`;
    const alternates = { languages: { th: thaiUrl, en: englishUrl, "x-default": thaiUrl } };

    return [
      { url: thaiUrl, lastModified: LAST_UPDATED, changeFrequency, priority, alternates },
      { url: englishUrl, lastModified: LAST_UPDATED, changeFrequency, priority, alternates },
    ];
  });

  const gameLandingUrl = `${SITE_URL}/game/cat-vs-dog/`;
  const gameEnglishUrl = `${SITE_URL}/game/cat-vs-dog/en/`;
  const gameThaiUrl = `${SITE_URL}/game/cat-vs-dog/th/`;
  const gameAlternates = {
    languages: {
      en: gameEnglishUrl,
      th: gameThaiUrl,
      "x-default": gameLandingUrl,
    },
  };
  const gameEntries: MetadataRoute.Sitemap = [
    { url: gameLandingUrl, lastModified: GAME_LAST_UPDATED, changeFrequency: "monthly", priority: 0.8, alternates: gameAlternates },
    { url: gameEnglishUrl, lastModified: GAME_LAST_UPDATED, changeFrequency: "monthly", priority: 0.8, alternates: gameAlternates },
    { url: gameThaiUrl, lastModified: GAME_LAST_UPDATED, changeFrequency: "monthly", priority: 0.8, alternates: gameAlternates },
  ];

  const [thaiPosts, englishPosts] = await Promise.all([
    getPublishedBlogPosts("th"),
    getPublishedBlogPosts("en"),
  ]);
  const bySlug = new Map<string, { th?: (typeof thaiPosts)[number]; en?: (typeof englishPosts)[number] }>();
  for (const post of thaiPosts) bySlug.set(post.slug, { ...bySlug.get(post.slug), th: post });
  for (const post of englishPosts) bySlug.set(post.slug, { ...bySlug.get(post.slug), en: post });

  const blogEntries: MetadataRoute.Sitemap = [];
  for (const [slug, versions] of bySlug) {
    const thaiUrl = `${SITE_URL}/blog/${slug}`;
    const englishUrl = `${SITE_URL}/EN/blog/${slug}`;
    const languages: Record<string, string> = {};
    if (versions.th) languages.th = thaiUrl;
    if (versions.en) languages.en = englishUrl;
    languages["x-default"] = versions.th ? thaiUrl : englishUrl;
    const alternates = { languages };
    if (versions.th) blogEntries.push({ url: thaiUrl, lastModified: versions.th.updatedAt, changeFrequency: "monthly", priority: 0.7, alternates });
    if (versions.en) blogEntries.push({ url: englishUrl, lastModified: versions.en.updatedAt, changeFrequency: "monthly", priority: 0.7, alternates });
  }

  return [...staticEntries, ...gameEntries, ...blogEntries];
}
