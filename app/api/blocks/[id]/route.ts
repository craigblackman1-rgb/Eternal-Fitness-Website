import { NextResponse } from "next/server";
import { getAuthenticatedUser, jsonError, unauthorized } from "@/lib/api";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("id", params.id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ success: true });
}
