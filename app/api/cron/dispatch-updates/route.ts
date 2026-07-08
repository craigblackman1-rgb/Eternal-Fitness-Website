import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase-admin";
import { dispatchUpdateEmail } from "@/lib/updates/send";

export const dynamic = "force-dynamic";

/** Constant-time string compare to avoid leaking the secret via timing. */
function secretsMatch(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Cron dispatcher for scheduled update emails.
 *
 * Hit this on a schedule (e.g. a Coolify Scheduled Task every 5 minutes):
 *   curl -X POST https://<hub>/api/cron/dispatch-updates \
 *        -H "Authorization: Bearer $CRON_SECRET"
 *
 * It finds every 'scheduled' update whose time has passed, sends it, and marks
 * it 'sent' (or 'failed', with the error recorded). Uses the service-role
 * client because there's no logged-in user on a cron call.
 *
 * The secret can be provided as an Authorization: Bearer header or a ?secret=
 * query param (some schedulers only do GET). GET and POST both work.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization") || "";
  const url = new URL(request.url);
  const provided = auth.replace(/^Bearer\s+/i, "") || url.searchParams.get("secret") || "";
  if (!secretsMatch(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("sent_updates")
    .select("id, subject, body_html, client_email")
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { id: string; outcome: string }[] = [];

  for (const update of due ?? []) {
    if (!update.client_email) {
      await supabase
        .from("sent_updates")
        .update({ status: "failed", send_error: "No recipient email", updated_at: new Date().toISOString() })
        .eq("id", update.id);
      results.push({ id: update.id, outcome: "failed:no-email" });
      continue;
    }

    const res = await dispatchUpdateEmail({
      to: update.client_email,
      subject: update.subject,
      html: update.body_html,
    });

    if (res.error) {
      await supabase
        .from("sent_updates")
        .update({ status: "failed", send_error: res.error, updated_at: new Date().toISOString() })
        .eq("id", update.id);
      results.push({ id: update.id, outcome: "failed" });
      continue;
    }

    await supabase
      .from("sent_updates")
      .update({
        status: "sent",
        emailed: res.emailed,
        sent_at: new Date().toISOString(),
        send_error: res.dryRun ? "Email sending isn't configured — logged, not emailed" : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", update.id);
    results.push({ id: update.id, outcome: res.emailed ? "sent" : "logged-dry-run" });
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
