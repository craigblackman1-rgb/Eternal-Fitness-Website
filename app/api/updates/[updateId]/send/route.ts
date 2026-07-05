import { NextResponse } from "next/server";
import { getAuthenticatedUser, jsonError, notFound, unauthorized } from "@/lib/api";
import { dispatchUpdateEmail } from "@/lib/updates/send";

/**
 * Send a saved draft/scheduled update right now (the "send it now instead of
 * waiting" button). Marks the record sent/failed just like the cron dispatcher.
 */
export async function POST(request: Request, { params }: { params: { updateId: string } }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { data: update } = await supabase
    .from("sent_updates")
    .select("id, status, subject, body_html, client_email")
    .eq("id", params.updateId)
    .single();

  if (!update) return notFound("Update not found");
  if (!["draft", "scheduled", "failed"].includes(update.status)) {
    return jsonError("This update has already been sent", 409);
  }

  // Allow overriding the recipient from the request (edit screen may have a fresher one).
  const body = await request.json().catch(() => ({}));
  const to = (body.clientEmail as string) || update.client_email;
  if (!to) return jsonError("No recipient email on this update", 400);

  const result = await dispatchUpdateEmail({ to, subject: update.subject, html: update.body_html });

  if (result.error) {
    await supabase
      .from("sent_updates")
      .update({ status: "failed", send_error: result.error, updated_at: new Date().toISOString() })
      .eq("id", update.id);
    return jsonError(result.error, 500);
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
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ success: true, emailed: result.emailed, dryRun: result.dryRun });
}
