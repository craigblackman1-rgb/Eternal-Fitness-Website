import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { safeRequestJson } from "@/lib/safe-request-json";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: client, error } = await supabase.from("clients").select("*").eq("client_number", parseInt(params.id)).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await safeRequestJson(request);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data as Record<string, unknown>;
  const { data, error } = await supabase.from("clients").update(body).eq("client_number", parseInt(params.id)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("clients").delete().eq("client_number", parseInt(params.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
