/**
 * Reusable SMTP email send layer.
 * Designed so the Decoded Ops hub can adopt the same module.
 *
 * Env vars:
 *   SMTP_HOST       — SMTP server hostname
 *   SMTP_PORT       — SMTP port (default 587)
 *   SMTP_USER       — SMTP username
 *   SMTP_PASS       — SMTP password
 *   SMTP_FROM       — From address (e.g. "Esther Fair <esther@eternal-fitness.co.uk>")
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
  /** true when SMTP is not configured — nothing was actually sent */
  dryRun?: boolean;
}

export interface EmailSender {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

function isConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    from: process.env.SMTP_FROM || "Eternal Fitness <noreply@eternal-fitness.co.uk>",
  };
}

async function sendNodemailer(input: SendEmailInput): Promise<SendEmailResult> {
  const nodemailer = await import("nodemailer");
  const config = getSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  const to = Array.isArray(input.to) ? input.to.join(", ") : input.to;

  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject: input.subject,
    html: input.html,
    text: input.text || undefined,
  });

  return { success: true, messageId: info.messageId };
}

export function getEmailSender(): EmailSender {
  if (!isConfigured()) {
    return {
      async send(_input: SendEmailInput) {
        return {
          success: true,
          messageId: "dry-run-no-smtp-configured",
          dryRun: true,
        };
      },
    };
  }

  return { send: sendNodemailer };
}

export function getEmailStatus(): { configured: boolean; config: { host: string; port: number; from: string } } {
  const config = getSmtpConfig();
  return {
    configured: isConfigured(),
    config: { host: config.host, port: config.port, from: config.from },
  };
}
