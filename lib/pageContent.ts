import { createAdminClient } from "@/lib/supabase-admin";

export async function getPageContent(
  pageSlug: string,
  blockKey: string,
  fallback: string,
): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("page_content_blocks")
      .select("content")
      .eq("page_slug", pageSlug)
      .eq("block_key", blockKey)
      .maybeSingle();
    return data?.content ?? fallback;
  } catch {
    return fallback;
  }
}

export async function upsertPageContentBlock(
  pageSlug: string,
  blockKey: string,
  label: string,
  content: string,
  updatedBy: string,
) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("page_content_blocks")
    .select("id, version")
    .eq("page_slug", pageSlug)
    .eq("block_key", blockKey)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("page_content_blocks")
      .update({
        content,
        label,
        version: existing.version + 1,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("page_content_blocks")
    .insert({
      page_slug: pageSlug,
      block_key: blockKey,
      label,
      content,
      updated_by: updatedBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
