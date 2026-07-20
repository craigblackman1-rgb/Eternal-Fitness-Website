import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("improvement_log")
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
    title: string;
    entry_date: string;
    process_ref: string;
    broke: string;
    changed: string;
    result: string;
  }>;

  if (!body.ref || !body.title || !body.broke || !body.changed || !body.result) {
    return NextResponse.json(
      { error: "ref, title, broke, changed and result are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("improvement_log")
    .insert({
      ref: body.ref,
      title: body.title,
      entry_date: body.entry_date ?? null,
      process_ref: body.process_ref ?? null,
      broke: body.broke,
      changed: body.changed,
      result: body.result,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
