import { NextResponse } from "next/server";
import { getAuthenticatedUser, getClientByNumber, jsonError, notFound, unauthorized } from "@/lib/api";
import { dispatchUpdateEmail, DEFAULT_UPDATE_SUBJECT } from "@/lib/updates/send";

type Action = "test" | "send" | "log" | "draft" | "schedule";

interface CreateBody {
  action: Action;
  subject?: string;
  html?: string;
  sections?: Record<string, string>;
  blockNumber?: number;
  templateKind?: string;
  clientEmail?: string;
  scheduledFor?: string; // ISO string, for action = schedule
  testRecipient?: string; // for action = test
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const client = await getClientByNumber(supabase, params.id, "id, name");
  if (!client) return notFound("Client not found");

  const body = (await request.json()) as CreateBody;
  const {
    action,
    html = "",
    sections,
    blockNumber = 0,
    templateKind = "six_week_update",
    clientEmail,
    scheduledFor,
    testRecipient,
  } = body;
  const subject = body.subject || DEFAULT_UPDATE_SUBJECT;

  // 1. Test send — fires a real email to a chosen inbox, never logged.
  if (action === "test") {
    if (!testRecipient) return jsonError("No test recipient", 400);
    const result = await dispatchUpdateEmail({ to: testRecipient, subject: `[TEST] ${subject}`, html });
    if (result.error) return jsonError(result.error, 500);
    return NextResponse.json({ success: true, emailed: result.emailed, test: true });
  }

  // Remember the client's email on their record so it prefills next time.
  if (clientEmail) {
    await supabase.from("clients").update({ email: clientEmail }).eq("id", client.id).then(undefined, () => {});
  }

  const base = {
    client_id: client.id,
    subject,
    body_html: html,
    block_number: blockNumber,
    template_kind: templateKind,
    sections: sections ?? null,
    client_email: clientEmail ?? null,
  };

  // 2. Draft — saved, editable, not sent.
  if (action === "draft") {
    const { data, error } = await supabase
      .from("sent_updates")
      .insert({ ...base, status: "draft", emailed: false })
      .select("id")
      .single();
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ success: true, id: data.id, status: "draft" });
  }

  // 3. Schedule — saved with a future send time; the cron dispatcher sends it.
  if (action === "schedule") {
    if (!scheduledFor) return jsonError("A scheduled time is required", 400);
    const when = new Date(scheduledFor);
    if (isNaN(when.getTime())) return jsonError("Invalid scheduled time", 400);
    if (when.getTime() < Date.now() - 60_000) {
      return jsonError("Scheduled time is in the past", 400);
    }
    if (!clientEmail) return jsonError("Client email is required to schedule", 400);
    const { data, error } = await supabase
      .from("sent_updates")
      .insert({ ...base, status: "scheduled", scheduled_for: when.toISOString(), emailed: false })
      .select("id")
      .single();
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ success: true, id: data.id, status: "scheduled", scheduledFor: when.toISOString() });
  }

  // 4. Log — Esther delivered it another way, but wants a record.
  if (action === "log") {
    const { error } = await supabase
      .from("sent_updates")
      .insert({ ...base, status: "sent", emailed: false, sent_at: new Date().toISOString() });
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ success: true, emailed: false });
  }

  // 5. Send now.
  if (action === "send") {
    if (!clientEmail) return jsonError("Client email address is required", 400);
    const result = await dispatchUpdateEmail({ to: clientEmail, subject, html });
    if (result.error) return jsonError(result.error, 500);

    const { error } = await supabase.from("sent_updates").insert({
      ...base,
      status: "sent",
      emailed: result.emailed,
      sent_at: new Date().toISOString(),
    });
    if (error) return jsonError(error.message, 500);

    if (result.dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        emailed: false,
        error: "Email sending isn't configured — the email was NOT sent, but the update was logged. Set SENDGRID_API_KEY (or SMTP_*) to actually send.",
      });
    }
    return NextResponse.json({ success: true, emailed: true, messageId: result.messageId });
  }

  return jsonError(`Unknown action: ${action}`, 400);
}
