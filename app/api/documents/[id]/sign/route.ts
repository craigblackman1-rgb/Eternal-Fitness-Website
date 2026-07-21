import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isFullySigned } from "@/lib/documents/types";

// Apply a signature. The client signs unauthenticated via the document UUID, so
// this uses the service-role client. role = 'client' | 'trainer'.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { role, name, signature, date, consent_choices, feedback_responses } = await request.json();

  if (role !== "client" && role !== "trainer") {
    return NextResponse.json({ error: "role must be 'client' or 'trainer'" }, { status: 400 });
  }
  if (!name?.trim() || !signature?.trim()) {
    return NextResponse.json({ error: "Name and signature are required" }, { status: 400 });
  }

  const { data: doc, error: readErr } = await admin
    .from("client_documents")
    .select("*")
    .eq("id", params.id)
    .single();
  if (readErr || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const signedDate = date || new Date().toISOString().slice(0, 10);
  const update: Record<string, unknown> =
    role === "client"
      ? { client_name: name.trim(), client_signature: signature.trim(), client_signed_date: signedDate }
      : { trainer_name: name.trim(), trainer_signature: signature.trim(), trainer_signed_date: signedDate };

  if (role === "client" && consent_choices && typeof consent_choices === "object") {
    update.consent_choices = consent_choices;
  }
  if (role === "client" && feedback_responses && typeof feedback_responses === "object") {
    update.feedback_responses = feedback_responses;
  }

  const next = { ...doc, ...update };
  if (isFullySigned(next)) {
    update.status = "signed";
    update.signed_at = new Date().toISOString();
  } else if (doc.status === "draft") {
    update.status = "sent";
  }
  update.updated_at = new Date().toISOString();

  const { error } = await admin.from("client_documents").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, signed: update.status === "signed" });
}
