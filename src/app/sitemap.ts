import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/landing/site";

const routes = [
  { path: "", changeFrequency: "monthly", priority: 1 },
  { path: "/inside", changeFrequency: "monthly", priority: 0.8 },
  { path: "/playgroup", changeFrequency: "monthly", priority: 0.8 },
  { path: "/creative", changeFrequency: "monthly", priority: 0.8 },
  { path: "/little-explorer-program", changeFrequency: "monthly", priority: 0.8 },
  { path: "/membership", changeFrequency: "monthly", priority: 0.8 },
  { path: "/dinner", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/first-visit", changeFrequency: "monthly", priority: 0.7 },
  { path: "/signup", changeFrequency: "yearly", priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap(({ path, changeFrequency, priority }) => {
    const thaiUrl = `${SITE_URL}${path || "/"}`;
    const englishUrl = `${SITE_URL}/EN${path || "/"}`;
    const alternates = { languages: { th: thaiUrl, en: englishUrl } };

    return [
      { url: thaiUrl, changeFrequency, priority, alternates },
      { url: englishUrl, changeFrequency, priority, alternates },
    ];
  });
}
