import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { dispatchUpdateEmail } from "@/lib/updates/send";

/**
 * Send a saved draft/scheduled update right now (the "send it now instead of
 * waiting" button). Marks the record sent/failed just like the cron dispatcher.
 */
export async function POST(request: Request, { params }: { params: { updateId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: update } = await supabase
    .from("sent_updates")
    .select("id, status, subject, body_html, client_email")
    .eq("id", params.updateId)
    .single();

  if (!update) return NextResponse.json({ error: "Update not found" }, { status: 404 });
  if (!["draft", "scheduled", "failed"].includes(update.status)) {
    return NextResponse.json({ error: "This update has already been sent" }, { status: 409 });
  }

  // Allow overriding the recipient from the request (edit screen may have a fresher one).
  const body = await request.json().catch(() => ({}));
  const to = (body.clientEmail as string) || update.client_email;
  if (!to) return NextResponse.json({ error: "No recipient email on this update" }, { status: 400 });

  const result = await dispatchUpdateEmail({ to, subject: update.subject, html: update.body_html });

  if (result.error) {
    await supabase
      .from("sent_updates")
      .update({ status: "failed", send_error: result.error, updated_at: new Date().toISOString() })
      .eq("id", update.id);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const { error } = await supabase
    .from("sent_updates")
    .update({
      status: "sent",
      emailed: result.emailed,
      client_email: to,
      sent_at: new Date().toISOString(),
      send_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", update.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, emailed: result.emailed, dryRun: result.dryRun });
}
