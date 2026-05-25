/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
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
