import { NextResponse } from "next/server";
import { getAuthenticatedUser, jsonError, unauthorized } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { data: client, error } = await supabase.from("clients").select("*").eq("client_number", parseInt(params.id)).single();
  if (error) return jsonError(error.message, 404);
  return NextResponse.json(client);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const { data, error } = await supabase.from("clients").update(body).eq("client_number", parseInt(params.id)).select().single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { error } = await supabase.from("clients").delete().eq("client_number", parseInt(params.id));
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true });
}
