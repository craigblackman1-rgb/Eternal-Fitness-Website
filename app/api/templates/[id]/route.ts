import { NextResponse } from "next/server";
import { getAuthenticatedUser, jsonError, unauthorized } from "@/lib/api";

// Edit a document template (name, body, signature requirements, active flag).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { name, body, requires_client_signature, requires_trainer_signature, is_active } = await request.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) update.name = name;
  if (body !== undefined) update.body = body;
  if (requires_client_signature !== undefined) update.requires_client_signature = requires_client_signature;
  if (requires_trainer_signature !== undefined) update.requires_trainer_signature = requires_trainer_signature;
  if (is_active !== undefined) update.is_active = is_active;

  const { error } = await supabase.from("document_templates").update(update).eq("id", params.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true });
}
