import { stripHtml } from "@/lib/strip-html";
import type { SentUpdate } from "@/types";

/** Verbatim (plain-text) recap of recently sent client updates, for inclusion in an AI system prompt. */
export function buildRecentUpdatesSection(updates: Pick<SentUpdate, "subject" | "body_html" | "sent_at">[]): string {
  if (updates.length === 0) return "No previous updates sent to this client yet.";

  return updates
    .map((u) => `Sent ${u.sent_at} — "${u.subject}"\n${stripHtml(u.body_html)}`)
    .join("\n\n---\n\n");
}
