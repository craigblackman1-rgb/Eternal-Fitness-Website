import { NextResponse } from "next/server";
import { getAuthenticatedUser, getClientByNumber, jsonError, notFound, unauthorized } from "@/lib/api";

// Create a new client document by snapshotting the active template for a kind.
export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { clientNumber, kind } = await request.json();
  if (!clientNumber || !kind) {
    return jsonError("clientNumber and kind are required", 400);
  }

  const client = await getClientByNumber(supabase, clientNumber, "id, name");
  if (!client) return notFound("Client not found");

  const { data: template } = await supabase
    .from("document_templates")
    .select("*")
    .eq("kind", kind)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) {
    return jsonError(`No active template for "${kind}"`, 400);
  }

  const { data: inserted, error } = await supabase
    .from("client_documents")
    .insert({
      client_id: client.id,
      kind,
      title: template.name,
      template_id: template.id,
      template_version: template.version,
      body: template.body,
      requires_client_signature: template.requires_client_signature,
      requires_trainer_signature: template.requires_trainer_signature,
      status: "draft",
      version: 1,
    })
    .select("id")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
