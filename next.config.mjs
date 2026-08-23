/** @type {import('next').NextConfig} */
const codingStudentProjectRoutes = [
  "coding-with-ai/car-maze",
  "coding-with-ai/cat-vs-dog",
];

const mainSiteRoutes = [
  "tools",
  "tools/kids-routine-chart",
  "tools/polaroid-generator",
  "tools/cat-passport",
  "tools/cat-food-calculator",
  "tools/skinny-filter",
  "inside",
  "playgroup",
  "creative",
  "coding-with-ai",
  ...codingStudentProjectRoutes,
  "membership",
  "dinner",
  "contact",
  "faq",
  "first-visit",
  "about",
  "editorial-process",
  "thank-you",
];

const nextConfig = {
  reactStrictMode: true,
  // Game directories use canonical trailing-slash URLs so their relative
  // assets and localized links resolve consistently.
  skipTrailingSlashRedirect: true,
  // Uploaded proof photos are served through an authenticated API route, not the
  // public folder, so no image domains config is required.
  async headers() {
    return [
      {
        source: "/main-site/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/landing/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/tools/kids-routine-chart/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/tools/polaroid-generator/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/tools/cat-passport/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/tools/cat-food-calculator/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/tools/skinny-filter/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/tools/shared/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      ...["/terms", "/privacy", "/EN/terms", "/EN/privacy"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=3600" }],
      })),
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
        ],
      },
      ...["/member/:path*", "/EN/member/:path*"].map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      })),
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/EN/index.html", destination: "/EN", permanent: true },
      { source: "/little-explorer-program", destination: "/playgroup", permanent: true },
      { source: "/little-explorer-program.html", destination: "/playgroup", permanent: true },
      { source: "/EN/little-explorer-program", destination: "/EN/playgroup", permanent: true },
      { source: "/EN/little-explorer-program.html", destination: "/EN/playgroup", permanent: true },
      { source: "/memberships", destination: "/playgroup", permanent: true },
      { source: "/memberships.html", destination: "/playgroup", permanent: true },
      { source: "/EN/memberships", destination: "/EN/playgroup", permanent: true },
      { source: "/EN/memberships.html", destination: "/EN/playgroup", permanent: true },
      ...mainSiteRoutes.map((route) => ({
        source: `/${route}.html`,
        destination: `/${route}`,
        permanent: true,
      })),
      ...mainSiteRoutes.map((route) => ({
        source: `/EN/${route}.html`,
        destination: `/EN/${route}`,
        permanent: true,
      })),
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/EN/privacy.html", destination: "/EN/privacy", permanent: true },
      { source: "/book", destination: "/signup", permanent: false },
      { source: "/book.html", destination: "/signup", permanent: false },
      { source: "/EN/book", destination: "/EN/signup", permanent: false },
      { source: "/EN/book.html", destination: "/EN/signup", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/main-site/index.html" },
      { source: "/EN", destination: "/main-site/EN/index.html" },
      ...mainSiteRoutes.map((route) => ({
        source: `/${route}`,
        destination: `/main-site/${route}.html`,
      })),
      ...mainSiteRoutes.map((route) => ({
        source: `/EN/${route}`,
        destination: `/main-site/EN/${route}.html`,
      })),
    ];
  },
};

export default nextConfig;
