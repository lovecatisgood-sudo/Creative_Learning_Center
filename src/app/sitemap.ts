import type { MetadataRoute } from "next";
import { getPublishedBlogPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/landing/site";
import { gameLocalizedUrls, HOSTED_GAMES } from "@/lib/game-routes";

export const dynamic = "force-dynamic";

const routes = [
  { path: "", changeFrequency: "monthly", priority: 1 },
  { path: "/tools", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/kids-routine-chart", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/polaroid-generator", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/cat-passport", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/cat-food-calculator", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/skinny-filter", changeFrequency: "monthly", priority: 0.6 },
  { path: "/inside", changeFrequency: "monthly", priority: 0.8 },
  { path: "/playgroup", changeFrequency: "monthly", priority: 0.8 },
  { path: "/creative", changeFrequency: "monthly", priority: 0.8 },
  { path: "/coding-with-ai", changeFrequency: "monthly", priority: 0.8 },
  { path: "/coding-with-ai/car-maze", changeFrequency: "monthly", priority: 0.6 },
  { path: "/coding-with-ai/cat-vs-dog", changeFrequency: "monthly", priority: 0.6 },
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

const LAST_UPDATED = new Date("2026-08-11T00:00:00+07:00");
const CODING_COURSE_UPDATED = new Date("2026-08-23T00:00:00+07:00");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = routes.flatMap(({ path, changeFrequency, priority }) => {
    const thaiUrl = `${SITE_URL}${path || "/"}`;
    const englishUrl = `${SITE_URL}/EN${path}`;
    const alternates = { languages: { th: thaiUrl, en: englishUrl, "x-default": thaiUrl } };

    return [
      { url: thaiUrl, lastModified: path.startsWith("/coding-with-ai") ? CODING_COURSE_UPDATED : LAST_UPDATED, changeFrequency, priority, alternates },
      { url: englishUrl, lastModified: path.startsWith("/coding-with-ai") ? CODING_COURSE_UPDATED : LAST_UPDATED, changeFrequency, priority, alternates },
    ];
  });

  const gameEntries: MetadataRoute.Sitemap = HOSTED_GAMES.flatMap((game) => {
    const urls = gameLocalizedUrls(SITE_URL, game.slug);
    const alternates = {
      languages: {
        en: urls.en,
        th: urls.th,
        "x-default": urls.landing,
      },
    };
    const lastModified = new Date(game.lastModified);

    return [
      { url: urls.landing, lastModified, changeFrequency: game.changeFrequency, priority: game.priority, alternates },
      { url: urls.en, lastModified, changeFrequency: game.changeFrequency, priority: game.priority, alternates },
      { url: urls.th, lastModified, changeFrequency: game.changeFrequency, priority: game.priority, alternates },
    ];
  });

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
