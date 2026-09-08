import type { DBSession, ChargedFree } from "@/types";
import { deriveSessionStatus } from "./session-status";

/**
 * CR-EF-099 — Session pot counter logic.
 *
 * A session "consumes" a slot from the client's pot when:
 *   - It is completed (status = 'completed'), OR
 *   - It is cancelled with charged_free = 'charged'
 *
 * A cancellation with charged_free = 'free' does NOT consume a slot.
 * A reschedule (cancelled + rebooked) does NOT consume a slot.
 *
 * Cancelled sessions with charged_free IS NULL are neither consumed nor free —
 * they are unreviewed and surfaced for human decision. Guessing charged takes
 * money from clients; guessing free gives away Esther revenue. Neither is
 * guessed.
 */

export interface SessionPotBreakdown {
  /** Sessions that have been completed. */
  completed: number;
  /** Cancelled sessions explicitly marked as charged. */
  chargedCancellations: number;
  /** Cancelled sessions explicitly marked as free. */
  freeCancellations: number;
  /** Cancelled sessions without a charged_free flag — awaiting review. */
  unreviewedCancellations: number;
  /** Total sessions that consumed a slot: baseline + completed + charged. */
  used: number;
  /** Total purchased from the client record, or null when not recorded. */
  purchased: number | null;
  /** Whether purchased fell back to a row count (sessions_purchased was NULL). */
  purchasedIsEstimate: boolean;
  /** Remaining = purchased - used, or null when purchased is unknown. */
  remaining: number | null;
  /** Best available total when purchased is not recorded — derived from session row count. */
  estimatedPurchase: number;
  /** Remaining derived from the estimate, for display when recorded purchased is unknown. */
  estimatedRemaining: number;
  /** Total sessions in the block (session rows). */
  totalInBlock: number;
  /** Unreviewed cancellations that may affect the count — surfaced for human decision. */
  unreviewed: number;
}

/**
 * Derive the session pot breakdown from a list of sessions in a block.
 * `sessionsPurchased` comes from the client record (not derived from session rows).
 * `baselineUsed` is the client's pre-hub session count (BUG-EF-142) — sessions
 * consumed before the hub existed. It is subtracted from purchased alongside
 * in-hub completions and charged cancellations.
 *
 * CR-EF-101 — sub-sessions (parent_session_id IS NOT NULL) are excluded from
 * the pot count entirely. One slot consumes one session no matter how much
 * work happened in it. This applies to completed sessions AND charged
 * cancellations.
 */
export function deriveSessionPot(
  sessions: Pick<DBSession, "status" | "charged_free" | "cancelled_at" | "parent_session_id" | "completed_at">[],
  sessionsPurchased: number | null,
  baselineUsed: number = 0,
): SessionPotBreakdown {
  // CR-EF-101 — only count sessions where parent_session_id IS NULL
  const potSessions = sessions.filter((s) => !s.parent_session_id);

  let completed = 0;
  let chargedCancellations = 0;
  let freeCancellations = 0;
  let unreviewedCancellations = 0;

  for (const s of potSessions) {
    const status = deriveSessionStatus(s);
    if (status === "completed") {
      completed++;
    } else if (status === "cancelled") {
      if (s.charged_free === "charged") {
        chargedCancellations++;
      } else if (s.charged_free === "free") {
        freeCancellations++;
      } else {
        // No charged_free flag — not yet decided. Do not guess.
        unreviewedCancellations++;
      }
    }
  }

  const used = baselineUsed + completed + chargedCancellations;
  const purchasedIsEstimate = sessionsPurchased == null;
  const purchased = purchasedIsEstimate ? null : sessionsPurchased;
  const remaining = purchased != null ? Math.max(purchased - used, 0) : null;

  // estimatedRemaining is used when purchased is unknown — derived from session
  // row count minus in-hub usage. The baseline does NOT apply here because
  // estimatedPurchase (potSessions.length) reflects only tracked rows; subtracting
  // the baseline (pre-hub, untracked) from a row-count estimate would understate
  // the true remaining. The baseline is only meaningful when purchased is known.
  const estimatedPurchase = potSessions.length;
  const estimatedRemaining = Math.max(estimatedPurchase - (completed + chargedCancellations), 0);

  return {
    completed,
    chargedCancellations,
    freeCancellations,
    unreviewedCancellations,
    used,
    purchased,
    purchasedIsEstimate,
    remaining,
    estimatedPurchase,
    estimatedRemaining,
    totalInBlock: potSessions.length,
    unreviewed: unreviewedCancellations,
  };
}

/**
 * Whether a given cancellation action would consume a session.
 * Used by the cancellation dialog to show the consequence before confirming.
 * NULL is never consumed here — it is surfaced for human decision instead.
 */
export function wouldConsumeSession(chargedFree: ChargedFree | null): boolean {
  return chargedFree === "charged";
}
