import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || "https://eternal-fitness.co.uk";

  // Mirrors the ALLOW_INDEXING gate in app/layout.tsx — staging/preview blocks
  // crawling entirely so it can never get indexed ahead of the production launch.
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/hub/", "/parq", "/agreement", "/documents/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
