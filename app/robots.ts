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

  const disallow = ["/api/", "/hub/", "/portal/", "/parq", "/agreement", "/documents/"];

  return {
    rules: [
      // Citation/answer-engine bots — allow, this business wants to be cited
      // by ChatGPT/Perplexity/Google AI Overviews/Claude, not just crawled.
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "anthropic-ai", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Google-Extended", allow: "/", disallow },
      // Training-only scrapers with no citation upside — block.
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "*", allow: "/", disallow },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
