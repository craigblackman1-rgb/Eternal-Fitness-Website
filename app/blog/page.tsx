import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import BlogPageClient from "./BlogPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Health Conditions & Cancer Recovery Blog",
  description: "Articles on training with health conditions, cancer rehabilitation, adaptive fitness and moving well at any ability. Written by Level 4 PT Esther Fair.",
  alternates: { canonical: "https://eternalfitness.co.uk/blog" },
};

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });

  return <BlogPageClient posts={posts ?? []} />;
}
