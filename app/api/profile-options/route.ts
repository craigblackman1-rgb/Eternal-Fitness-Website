import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("profile_option_lists")
    .select("value")
    .eq("category", category)
    .order("value", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { category, value } = body;

  if (!category || !value) {
    return NextResponse.json({ error: "category and value are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profile_option_lists")
    .insert({ category, value })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
