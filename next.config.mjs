/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Uploaded proof photos are served through an authenticated API route, not the
  // public folder, so no image domains config is required.
};

export default nextConfig;
