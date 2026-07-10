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
 * ECDSA P-256 signature (X-Twilio-Email-Event-Webhook-Signature /
 * X-Twilio-Email-Event-Webhook-Timestamp) — SendGrid's Signed Event Webhook
 * uses ECDSA on the P-256 curve, NOT Ed25519, despite the header names.
 * If the key is not set, requests are accepted but a warning is logged
 * (local dev convenience). If the key IS set, a verification failure of any
 * kind rejects the request — fail closed once we're supposed to be checking.
 */

const WEBHOOK_KEY = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || "";

// --- ECDSA P-256 verification via Web Crypto API -------------------------

/** SendGrid signatures are DER-encoded; Web Crypto's ECDSA verify wants raw r||s (32 bytes each for P-256). */
function derToRawEcdsaSignature(der: Buffer): Buffer {
  if (der[0] !== 0x30) throw new Error("Not a DER SEQUENCE");
  let offset = 2;
  if (der[1] & 0x80) offset += der[1] & 0x7f; // long-form length, skip extra length bytes

  function readInt(buf: Buffer, at: number): { value: Buffer; next: number } {
    if (buf[at] !== 0x02) throw new Error("Expected DER INTEGER");
    const len = buf[at + 1];
    let start = at + 2;
    let bytes = buf.subarray(start, start + len);
    // Strip a leading 0x00 sign-padding byte, then left-pad to 32 bytes.
    if (bytes.length > 32 && bytes[0] === 0x00) bytes = bytes.subarray(1);
    const padded = Buffer.alloc(32);
    bytes.copy(padded, 32 - bytes.length);
    return { value: padded, next: start + len };
  }

  const r = readInt(der, offset);
  const s = readInt(der, r.next);
  return Buffer.concat([r.value, s.value]);
}

async function verifySendGridSignature(
  publicKeyBase64: string,
  signatureBase64: string,
  timestamp: string,
  payload: string,
): Promise<boolean> {
  const keyBytes = Buffer.from(publicKeyBase64, "base64");
  const derSig = Buffer.from(signatureBase64, "base64");
  const rawSig = derToRawEcdsaSignature(derSig);

  const key = await crypto.subtle.importKey(
    "spki",
    keyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );

  const data = new TextEncoder().encode(`${timestamp}${payload}`);
  return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, new Uint8Array(rawSig), data);
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
    let valid = false;
    try {
      valid = await verifySendGridSignature(WEBHOOK_KEY, sig, ts, body);
    } catch (err) {
      console.error("[sendgrid-webhook] Signature verification error — rejecting request", err);
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }
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
