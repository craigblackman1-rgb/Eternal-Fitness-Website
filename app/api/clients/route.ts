import { NextResponse } from "next/server";
import { getAuthenticatedUser, jsonError, unauthorized } from "@/lib/api";

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const { name, profile } = body;

  if (!name?.trim()) {
    return jsonError("Name is required", 400);
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({ name: name.trim(), profile })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
