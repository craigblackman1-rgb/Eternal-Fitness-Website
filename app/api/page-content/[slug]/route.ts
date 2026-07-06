import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("page_content_blocks")
    .select("*")
    .eq("page_slug", params.slug)
    .order("block_key");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { block_key, label, content } = await request.json();
  if (!block_key || !label) {
    return NextResponse.json({ error: "block_key and label are required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("page_content_blocks")
    .select("id, version")
    .eq("page_slug", params.slug)
    .eq("block_key", block_key)
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("page_content_blocks")
      .update({
        content: content ?? "",
        label,
        version: existing.version + 1,
        updated_by: user.email ?? user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from("page_content_blocks")
      .insert({
        page_slug: params.slug,
        block_key,
        label,
        content: content ?? "",
        updated_by: user.email ?? user.id,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  const urlPath = params.slug === "home" ? "/" : `/${params.slug}`;
  revalidatePath(urlPath);

  return NextResponse.json(result, { status: 201 });
}
