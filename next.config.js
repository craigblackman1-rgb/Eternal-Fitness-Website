/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    unoptimized: false,
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
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
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
