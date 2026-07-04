import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

// Public read for the client sign page — mediated by the unguessable UUID.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_documents")
    .select("id, kind, title, body, status, version, requires_client_signature, requires_trainer_signature, client_name, client_signature, client_signed_date, trainer_name, trainer_signature, trainer_signed_date")
    .eq("id", params.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

// Esther edits the document (title / body) or sends it (status → sent).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, action } = await request.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (action === "send") {
    update.status = "sent";
    update.sent_at = new Date().toISOString();
  } else {
    if (title !== undefined) update.title = title;
    if (body !== undefined) update.body = body;
  }

  const { error } = await supabase.from("client_documents").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
