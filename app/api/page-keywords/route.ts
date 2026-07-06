import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("page_keywords")
    .select("*")
    .order("page_slug");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { page_slug, ...fields } = body;

  if (!page_slug) {
    return NextResponse.json({ error: "page_slug is required" }, { status: 400 });
  }

  const allowedFields: Record<string, unknown> = {};
  if ("primary_keyword" in fields) allowedFields.primary_keyword = fields.primary_keyword;
  if ("keyword_cluster" in fields) allowedFields.keyword_cluster = fields.keyword_cluster;
  if ("status" in fields) allowedFields.status = fields.status;
  if ("notes" in fields) allowedFields.notes = fields.notes;
  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("page_keywords")
    .update(allowedFields)
    .eq("page_slug", page_slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
