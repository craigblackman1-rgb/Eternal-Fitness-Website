import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .order("published_at", { ascending: false });

  const blogEntries = (posts ?? []).map((post) => ({
    url: `https://eternalfitness.co.uk/blog/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const staticPages = [
    { url: "https://eternalfitness.co.uk", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "https://eternalfitness.co.uk/about", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "https://eternalfitness.co.uk/personal-training", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "https://eternalfitness.co.uk/pricing", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "https://eternalfitness.co.uk/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "https://eternalfitness.co.uk/faqs", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "https://eternalfitness.co.uk/blog", priority: 0.8, changeFrequency: "weekly" as const },
  ];

  return [
    ...staticPages.map((page) => ({ ...page, lastModified: new Date() })),
    ...blogEntries,
  ];
}
