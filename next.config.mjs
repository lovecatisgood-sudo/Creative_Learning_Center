/** @type {import('next').NextConfig} */
const mainSiteRoutes = [
  "inside",
  "playgroup",
  "creative",
  "little-explorer-program",
  "membership",
  "dinner",
  "contact",
  "faq",
  "first-visit",
  "thank-you",
];

const nextConfig = {
  reactStrictMode: true,
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
      ...["/terms", "/privacy", "/EN/terms", "/EN/privacy"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=3600" }],
      })),
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
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
      { source: "/memberships", destination: "/little-explorer-program", permanent: true },
      { source: "/memberships.html", destination: "/little-explorer-program", permanent: true },
      { source: "/EN/memberships", destination: "/EN/little-explorer-program", permanent: true },
      { source: "/EN/memberships.html", destination: "/EN/little-explorer-program", permanent: true },
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
