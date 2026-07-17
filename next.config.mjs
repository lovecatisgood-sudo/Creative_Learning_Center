/** @type {import('next').NextConfig} */
const mainSiteRoutes = [
  "inside",
  "memberships",
  "dinner",
  "faq",
  "first-visit",
  "thank-you",
];

const nextConfig = {
  reactStrictMode: true,
  // Uploaded proof photos are served through an authenticated API route, not the
  // public folder, so no image domains config is required.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...mainSiteRoutes.map((route) => ({
        source: `/${route}.html`,
        destination: `/${route}`,
        permanent: true,
      })),
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/book", destination: "/signup", permanent: false },
      { source: "/book.html", destination: "/signup", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/main-site/index.html" },
      ...mainSiteRoutes.map((route) => ({
        source: `/${route}`,
        destination: `/main-site/${route}.html`,
      })),
    ];
  },
};

export default nextConfig;
