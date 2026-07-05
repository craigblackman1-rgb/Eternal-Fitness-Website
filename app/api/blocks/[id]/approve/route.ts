import { NextResponse } from "next/server";
import { getAuthenticatedUser, jsonError, notFound, unauthorized } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { data: block, error: fetchError } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !block) {
    return notFound("Block not found");
  }

  if (block.status !== "draft") {
    return jsonError(`Block is already ${block.status}`, 400);
  }

  const { data, error } = await supabase
    .from("blocks")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(data);
}
