import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getEmailSender } from "@/lib/email";
import { buildDocumentReadyEmail } from "@/lib/email-templates/document-ready";

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://eternal-fitness.co.uk";

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

  if (action === "send_email") {
    return sendDocumentEmail(params.id);
  } else if (action === "send") {
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

async function sendDocumentEmail(docId: string): Promise<NextResponse> {
  const admin = createAdminClient();

  const { data: doc, error: docError } = await admin
    .from("client_documents")
    .select("id, title, status, client_id, client_name")
    .eq("id", docId)
    .single();
  if (docError || !doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id, name, email")
    .eq("id", doc.client_id)
    .single();
  if (clientError || !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const recipient = (client.email || "").trim();
  if (!recipient) {
    return NextResponse.json(
      { error: "No email address on file for this client. Add one on the client record, then try again." },
      { status: 400 },
    );
  }

  const signUrl = `${SITE_ORIGIN}/documents/${doc.id}/sign`;
  const html = buildDocumentReadyEmail({
    clientName: doc.client_name || client.name,
    greetingName: client.name,
    documentTitle: doc.title,
    signUrl,
  });

  const sender = getEmailSender();
  const result = await sender.send({
    to: recipient,
    subject: `Your document is ready to sign: ${doc.title}`,
    html,
  });

  const { error: updError } = await admin.from("client_documents").update({
    status: "sent",
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", docId);
  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });

  return NextResponse.json({ success: true, dryRun: Boolean(result.dryRun) });
}
