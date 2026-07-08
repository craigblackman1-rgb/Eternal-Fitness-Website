import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Create a new client document by snapshotting the active template for a kind.
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientNumber, kind } = await request.json();
  if (!clientNumber || !kind) {
    return NextResponse.json({ error: "clientNumber and kind are required" }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("client_number", clientNumber)
    .single();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: template } = await supabase
    .from("document_templates")
    .select("*")
    .eq("kind", kind)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) {
    return NextResponse.json({ error: `No active template for "${kind}"` }, { status: 400 });
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
