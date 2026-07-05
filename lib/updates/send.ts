import { getEmailSender } from "@/lib/email";

export interface DispatchResult {
  /** true when the email actually left the building (SMTP configured + no error). */
  emailed: boolean;
  /** true when SMTP is not configured — nothing was sent, but the caller may still log it. */
  dryRun: boolean;
  /** Provider message id, when a real send happened. */
  messageId?: string;
  /** Set when the send threw — the caller decides whether that's fatal. */
  error?: string;
}

/**
 * Single place that turns an update into an actual email. Shared by the
 * immediate send route, the send-a-saved-draft route, and the cron dispatcher
 * so they all behave identically (including the "SMTP not configured" dry run).
 */
export async function dispatchUpdateEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<DispatchResult> {
  const sender = getEmailSender();
  try {
    const result = await sender.send({ to: input.to, subject: input.subject, html: input.html });
    return {
      emailed: !result.dryRun,
      dryRun: !!result.dryRun,
      messageId: result.messageId,
    };
  } catch (err) {
    return {
      emailed: false,
      dryRun: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

export const DEFAULT_UPDATE_SUBJECT = "Your last 6 weeks with me 🏋️";
