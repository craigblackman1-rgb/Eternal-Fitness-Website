import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { ProcessStatus } from "@/types";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("process_entries")
    .select("*")
    .order("ref", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<{
    ref: string;
    name: string;
    owner: string;
    area: string;
    status: ProcessStatus;
    reviewed: string;
    category: string;
    sop_ref: string;
  }>;

  if (!body.ref || !body.name) {
    return NextResponse.json({ error: "ref and name are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("process_entries")
    .insert({
      ref: body.ref,
      name: body.name,
      owner: body.owner ?? "Esther Fair",
      area: body.area ?? "General",
      status: body.status ?? "draft",
      reviewed: body.reviewed ?? null,
      category: body.category ?? "General",
      sop_ref: body.sop_ref ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
