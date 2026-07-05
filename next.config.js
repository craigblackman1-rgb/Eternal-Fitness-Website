/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Self-hosted (Coolify/Docker) — Next's built-in optimizer assumes Vercel's
    // image infrastructure; serve originals directly instead.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // API responses can carry authenticated, client-specific data (PII,
        // PAR-Q medical answers). Keep them out of shared/CDN caches.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      {
        // HTML must revalidate every time — a cached page from a previous
        // deployment references purged /_next chunks (unstyled pages, dead
        // Server Actions). Hashed static assets carry their own caching.
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // Authenticated hub pages: never cache anywhere.
        source: "/hub/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/blog/getting-back-on-track-when-youve-fallen-off-the-wagon",
        destination: "/blog/managing-setbacks-in-your-recovery-journey",
        permanent: true,
      },
      {
        source: "/blog/myth-buster-are-low-fat-foods-healthy",
        destination: "/blog/nutrition-for-energy-recovery",
        permanent: true,
      },
      {
        source: "/blog/bmi-an-outdated-inaccurate-assessment-of-a-healthy-body-weight",
        destination: "/blog/why-bmi-doesnt-matter-with-health-conditions",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
