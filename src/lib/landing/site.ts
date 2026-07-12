// Canonical site origin. Host is lowercased (browsers treat it case-insensitively);
// override per-environment with NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://creative-club.siamesecat.cafe").replace(/\/$/, "");
export const OG_IMAGE = "/landing/og-siamese-cat-creative-club.jpg";
