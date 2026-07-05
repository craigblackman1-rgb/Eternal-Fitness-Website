import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
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

async function resolveClient(supabase: ReturnType<typeof createClient>, id: string) {
  const clientNumber = parseInt(id);
  const { data } = await supabase
    .from("clients")
    .select("id, name")
    .eq("client_number", clientNumber)
    .single();
  return data;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await resolveClient(supabase, params.id);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

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
    if (!testRecipient) return NextResponse.json({ error: "No test recipient" }, { status: 400 });
    const result = await dispatchUpdateEmail({ to: testRecipient, subject: `[TEST] ${subject}`, html });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id, status: "draft" });
  }

  // 3. Schedule — saved with a future send time; the cron dispatcher sends it.
  if (action === "schedule") {
    if (!scheduledFor) return NextResponse.json({ error: "A scheduled time is required" }, { status: 400 });
    const when = new Date(scheduledFor);
    if (isNaN(when.getTime())) return NextResponse.json({ error: "Invalid scheduled time" }, { status: 400 });
    if (when.getTime() < Date.now() - 60_000) {
      return NextResponse.json({ error: "Scheduled time is in the past" }, { status: 400 });
    }
    if (!clientEmail) return NextResponse.json({ error: "Client email is required to schedule" }, { status: 400 });
    const { data, error } = await supabase
      .from("sent_updates")
      .insert({ ...base, status: "scheduled", scheduled_for: when.toISOString(), emailed: false })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id, status: "scheduled", scheduledFor: when.toISOString() });
  }

  // 4. Log — Esther delivered it another way, but wants a record.
  if (action === "log") {
    const { error } = await supabase
      .from("sent_updates")
      .insert({ ...base, status: "sent", emailed: false, sent_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, emailed: false });
  }

  // 5. Send now.
  if (action === "send") {
    if (!clientEmail) return NextResponse.json({ error: "Client email address is required" }, { status: 400 });
    const result = await dispatchUpdateEmail({ to: clientEmail, subject, html });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

    const { error } = await supabase.from("sent_updates").insert({
      ...base,
      status: "sent",
      emailed: result.emailed,
      sent_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
