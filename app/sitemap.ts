import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || "https://eternalfitness.co.uk";

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .order("published_at", { ascending: false });

  const blogEntries = (posts ?? []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const staticPages = [
    { url: `${baseUrl}`, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/about`, priority: 0.9, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/personal-training`, priority: 0.9, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/pricing`, priority: 0.85, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/contact`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/faqs`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/blog`, priority: 0.85, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/privacy-policy`, priority: 0.5, changeFrequency: "yearly" as const },
    { url: `${baseUrl}/terms`, priority: 0.5, changeFrequency: "yearly" as const },
    { url: `${baseUrl}/cookies-policy`, priority: 0.5, changeFrequency: "yearly" as const },
    { url: `${baseUrl}/parq`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/agreement`, priority: 0.6, changeFrequency: "monthly" as const },
  ];

  return [
    ...staticPages.map((page) => ({ ...page, lastModified: new Date() })),
    ...blogEntries,
  ];
}
