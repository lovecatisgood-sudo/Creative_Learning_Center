import type { MetadataRoute } from "next";
import { CREATIVE_URL, SITE_URL } from "@/lib/landing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/inside`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/memberships`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/dinner`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/first-visit`, changeFrequency: "monthly", priority: 0.7 },
    { url: CREATIVE_URL, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
