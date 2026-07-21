import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getEmailSender } from "@/lib/email";
import { buildParqRequestEmail } from "@/lib/email-templates/parq-request";
import { mintParqLinkParams } from "@/lib/parq-link";

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://eternal-fitness.co.uk";

/**
 * Emails a client their PAR-Q link — either the blank form (first request) or a
 * signed 7-day edit link to their existing submission (update request). Mirrors
 * the document-engine's send_email action (app/api/documents/[id]/route.ts) so
 * PAR-Q has the same real send/resend behaviour as every other document kind,
 * instead of only a copy-to-clipboard link.
 */
export async function POST(request: Request) {
  const { clientNumber, parqId } = await request.json().catch(() => ({}));
  if (!clientNumber) return NextResponse.json({ error: "clientNumber is required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id, name, email, client_number")
    .eq("client_number", clientNumber)
    .single();
  if (clientError || !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const recipient = (client.email || "").trim();
  if (!recipient) {
    return NextResponse.json(
      { error: "No email address on file for this client. Add one on the client record, then try again." },
      { status: 400 },
    );
  }

  const isUpdate = Boolean(parqId);
  const signUrl = isUpdate
    ? (() => {
        const { exp, sig } = mintParqLinkParams(parqId);
        return `${SITE_ORIGIN}/parq/edit/${parqId}?exp=${exp}&sig=${sig}`;
      })()
    : `${SITE_ORIGIN}/parq?client=${client.client_number}`;

  const html = buildParqRequestEmail({
    clientName: client.name,
    greetingName: client.name,
    signUrl,
    isUpdate,
  });

  const sender = getEmailSender();
  const result = await sender.send({
    to: recipient,
    subject: isUpdate ? "Please review and update your PAR-Q — Eternal Fitness" : "Please complete your PAR-Q — Eternal Fitness",
    html,
  });

  if (isUpdate) {
    const { error: updError } = await admin
      .from("signed_parq")
      .update({ sent_date: new Date().toISOString() })
      .eq("id", parqId);
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, dryRun: Boolean(result.dryRun) });
}
