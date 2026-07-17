// Canonical site origin (trailing slash stripped). Override per-environment
// with NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://creative.siamesecat.cafe").replace(/\/$/, "");
export const CREATIVE_URL = `${SITE_URL}/creative`;
export const OG_IMAGE = "/landing/og-siamese-cat-creative-club.jpg";
