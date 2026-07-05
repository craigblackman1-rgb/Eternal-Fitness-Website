import { NextResponse } from "next/server";
import { getAuthenticatedUser, jsonError, notFound, unauthorized } from "@/lib/api";

// Create a new iteration: the current document is marked superseded and a fresh
// draft copy (version + 1, signatures cleared) is created that points back to it.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { data: current, error: readErr } = await supabase
    .from("client_documents")
    .select("*")
    .eq("id", params.id)
    .single();
  if (readErr || !current) return notFound();

  const { data: inserted, error: insErr } = await supabase
    .from("client_documents")
    .insert({
      client_id: current.client_id,
      kind: current.kind,
      title: current.title,
      template_id: current.template_id,
      template_version: current.template_version,
      body: current.body,
      requires_client_signature: current.requires_client_signature,
      requires_trainer_signature: current.requires_trainer_signature,
      status: "draft",
      version: (current.version ?? 1) + 1,
      supersedes_id: current.id,
    })
    .select("id")
    .single();
  if (insErr) return jsonError(insErr.message, 500);

  const { error: updErr } = await supabase
    .from("client_documents")
    .update({ status: "superseded", updated_at: new Date().toISOString() })
    .eq("id", current.id);
  if (updErr) return jsonError(updErr.message, 500);

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
