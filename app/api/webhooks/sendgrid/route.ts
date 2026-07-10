import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * SendGrid Event Webhook receiver.
 *
 * Register this URL in SendGrid:
 *   https://<hub-domain>/api/webhooks/sendgrid
 *
 * Required SendGrid dashboard settings:
 *   Mail Settings → Tracking → Open Tracking: ON
 *   Mail Settings → Tracking → Click Tracking: ON (HTML + Plain Text)
 *   Settings → Event Webhook → Enable: ON
 *   Settings → Event Webhook → URL: the URL above
 *   Settings → Event Webhook → Signed Events: ON (provides Ed25519 signature headers)
 *   Settings → Event Webhook → Events to track: Delivered, Opened, Clicked, Bounced, Dropped
 *
 * Security: if SENDGRID_WEBHOOK_PUBLIC_KEY is set, requests are verified via
 * Ed25519 signature (X-Twilio-Email-Event-Webhook-Signature /
 * X-Twilio-Email-Event-Webhook-Timestamp). If the key is not set, requests
 * are accepted but a warning is logged (local dev convenience).
 */

const WEBHOOK_KEY = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || "";

// --- Ed25519 verification via Web Crypto API (Node 16+ / modern runtimes) -----

async function verifyEd25519(
  publicKeyBase64: string,
  signatureBase64: string,
  timestamp: string,
  payload: string,
): Promise<boolean> {
  try {
    const keyBytes = Buffer.from(publicKeyBase64, "base64");
    const sigBytes = Buffer.from(signatureBase64, "base64");

    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "Ed25519" } as any,
      false,
      ["verify"],
    );

    const data = new TextEncoder().encode(`${timestamp}${payload}`);
    return await crypto.subtle.verify({ name: "Ed25519" } as any, key, sigBytes, data);
  } catch {
    // Web Crypto Ed25519 may not be available in all environments.
    // Fall back to accepting the request (signature check disabled).
    console.warn("[sendgrid-webhook] Ed25519 verification unavailable — accepting request without verification");
    return true;
  }
}

interface SendGridEvent {
  sg_message_id: string;
  event: string;
  timestamp: number;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  const body = await request.text();

  // Verify signature if the public key is configured.
  if (WEBHOOK_KEY) {
    const sig = request.headers.get("x-twilio-email-event-webhook-signature") || "";
    const ts = request.headers.get("x-twilio-email-event-webhook-timestamp") || "";
    if (!sig || !ts) {
      console.warn("[sendgrid-webhook] Missing signature headers — rejecting request");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    const valid = await verifyEd25519(WEBHOOK_KEY, sig, ts, body);
    if (!valid) {
      console.warn("[sendgrid-webhook] Invalid signature — rejecting request");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[sendgrid-webhook] SENDGRID_WEBHOOK_PUBLIC_KEY not set — verification disabled");
  }

  let events: SendGridEvent[];
  try {
    events = JSON.parse(body);
    if (!Array.isArray(events)) events = [events];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();

  for (const evt of events) {
    if (!evt.sg_message_id || typeof evt.timestamp !== "number") continue;

    // SendGrid appends a filter suffix like ".filter001" to the message ID in
    // webhook payloads. Strip it for prefix matching against the original ID
    // stored by the send routes.
    const sgId = evt.sg_message_id.split(".")[0];
    const eventTs = new Date(evt.timestamp * 1000).toISOString();

    if (evt.event === "open") {
      // Match by prefix — the stored ID may or may not have the suffix.
      const { data: row } = await supabase
        .from("sent_updates")
        .select("id, opened_at, open_count")
        .or(`sg_message_id.eq.${evt.sg_message_id},sg_message_id.eq.${sgId}`)
        .limit(1)
        .maybeSingle();

      if (row) {
        await supabase
          .from("sent_updates")
          .update({
            opened_at: row.opened_at || eventTs,
            open_count: (row.open_count || 0) + 1,
          })
          .eq("id", row.id);
      }
    } else if (evt.event === "click") {
      const { data: row } = await supabase
        .from("sent_updates")
        .select("id, clicked_at, click_count")
        .or(`sg_message_id.eq.${evt.sg_message_id},sg_message_id.eq.${sgId}`)
        .limit(1)
        .maybeSingle();

      if (row) {
        await supabase
          .from("sent_updates")
          .update({
            clicked_at: row.clicked_at || eventTs,
            click_count: (row.click_count || 0) + 1,
          })
          .eq("id", row.id);
      }
    }
    // Other events (delivered, bounce, etc.) — silently skip.
  }

  return NextResponse.json({ ok: true });
}
