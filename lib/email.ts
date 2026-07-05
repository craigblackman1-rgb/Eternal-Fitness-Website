/**
 * Reusable email send layer. Designed so the Decoded Ops hub can adopt it too.
 *
 * Two backends, auto-selected:
 *   1. Twilio SendGrid Web API (preferred) — set SENDGRID_API_KEY.
 *   2. SMTP relay (fallback) — set SMTP_HOST / SMTP_USER / SMTP_PASS.
 * If neither is set, send() is a graceful dry run (nothing leaves the app).
 *
 * From address (both backends): MAIL_FROM or SENDGRID_FROM or SMTP_FROM,
 * accepting either "email@x.com" or "Name <email@x.com>".
 *
 * Env vars:
 *   SENDGRID_API_KEY — SendGrid API key (enables the Web API backend)
 *   MAIL_FROM        — From address, e.g. "Esther Fair <esther@eternal-fitness.co.uk>"
 *   SMTP_HOST/PORT/USER/PASS/FROM — SMTP relay fallback
 */

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: true;
  messageId: string;
  /** true when no email backend is configured — nothing was actually sent */
  dryRun?: boolean;
}

export interface EmailSender {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

type Backend = "sendgrid" | "smtp" | "none";

function selectBackend(): Backend {
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  return "none";
}

const DEFAULT_FROM = "Eternal Fitness <noreply@eternal-fitness.co.uk>";

function getFromRaw(): string {
  return process.env.MAIL_FROM || process.env.SENDGRID_FROM || process.env.SMTP_FROM || DEFAULT_FROM;
}

/** Parse "Name <email@x.com>" or "email@x.com" into its parts. */
function parseFrom(raw: string): { email: string; name?: string } {
  const match = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1] || undefined, email: match[2].trim() };
  return { email: raw.trim() };
}

/** Cheap HTML→text fallback so every email carries a plain-text part (deliverability). */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&mdash;/gi, "—")
    .replace(/&hellip;/gi, "…")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- SendGrid Web API ------------------------------------------------------

async function sendSendgrid(input: SendEmailInput): Promise<SendEmailResult> {
  const from = parseFrom(getFromRaw());
  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).map((email) => ({ email }));
  const text = input.text || htmlToText(input.html);

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: recipients }],
      from,
      subject: input.subject,
      // SendGrid requires text/plain before text/html.
      content: [
        { type: "text/plain", value: text || " " },
        { type: "text/html", value: input.html },
      ],
    }),
  });

  if (res.status !== 202) {
    const detail = await res.text().catch(() => "");
    throw new Error(`SendGrid send failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  return { success: true, messageId: res.headers.get("x-message-id") || "sendgrid-accepted" };
}

// --- SMTP relay (fallback) -------------------------------------------------

async function sendNodemailer(input: SendEmailInput): Promise<SendEmailResult> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });

  const to = Array.isArray(input.to) ? input.to.join(", ") : input.to;

  const info = await transporter.sendMail({
    from: getFromRaw(),
    to,
    subject: input.subject,
    html: input.html,
    text: input.text || htmlToText(input.html) || undefined,
  });

  return { success: true, messageId: info.messageId };
}

export function getEmailSender(): EmailSender {
  const backend = selectBackend();
  if (backend === "sendgrid") return { send: sendSendgrid };
  if (backend === "smtp") return { send: sendNodemailer };
  return {
    async send(_input: SendEmailInput) {
      return { success: true, messageId: "dry-run-no-email-backend", dryRun: true };
    },
  };
}

export function getEmailStatus(): { configured: boolean; backend: Backend; from: string } {
  const backend = selectBackend();
  return { configured: backend !== "none", backend, from: getFromRaw() };
}
