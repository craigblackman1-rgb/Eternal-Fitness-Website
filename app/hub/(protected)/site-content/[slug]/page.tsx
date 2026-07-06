import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SiteContentEditor } from "./site-content-editor";

export default async function SiteContentSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  const { data: keyword } = await supabase
    .from("page_keywords")
    .select("*")
    .eq("page_slug", params.slug)
    .single();

  if (!keyword) redirect("/hub/site-content");

  const { data: blocks } = await supabase
    .from("page_content_blocks")
    .select("*")
    .eq("page_slug", params.slug)
    .order("block_key");

  return (
    <SiteContentEditor
      keyword={keyword}
      blocks={blocks ?? []}
    />
  );
}
