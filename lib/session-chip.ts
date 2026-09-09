/**
 * Time-aware session chip derivation — mobile training routes (pwa-parity u5).
 *
 * Each chip reflects BOTH the session's real state AND where it sits relative
 * to now, so a completed session never reads "Next" and a past-but-unlogged
 * session is honestly flagged.
 */

export type ChipVariant =
  | "done"
  | "cancelled"
  | "not-logged"
  | "next"
  | "applied"
  | "open"
  | "in-progress";

export interface SessionChip {
  label: string;
  variant: ChipVariant;
}

function hasWorkout(displayName: string | undefined): boolean {
  if (!displayName) return false;
  return displayName !== "No workout assigned yet" && displayName !== "—";
}

function sessionEndMs(scheduledAt: string, durationMinutes: number): number {
  return new Date(scheduledAt).getTime() + durationMinutes * 60_000;
}

/**
 * Derive a truthful, time-aware chip for a session row.
 *
 * @param status          Derived lifecycle status (from deriveSessionStatus)
 * @param scheduledAt     ISO timestamp of the session
 * @param durationMinutes Duration in minutes
 * @param displayName     The workout name (from sessionWorkoutName)
 * @param opts            Optional signals from the session record
 * @param isNextUpcoming  True if this is the earliest upcoming session with a workout
 */
export function deriveSessionChip(
  status: string,
  scheduledAt: string | null,
  durationMinutes: number,
  displayName: string | undefined,
  opts: {
    sessionLogStartedAt?: string | null;
    sessionLogCompletedAt?: string | null;
    completedAt?: string | null;
  } = {},
  isNextUpcoming: boolean = false,
): SessionChip {
  // Completed — always "Done"
  if (
    status === "completed" ||
    opts.completedAt ||
    opts.sessionLogCompletedAt
  ) {
    return { label: "Done", variant: "done" };
  }

  // Cancelled — always "Cancelled"
  if (status === "cancelled") {
    return { label: "Cancelled", variant: "cancelled" };
  }

  // In progress (log started but not completed)
  if (opts.sessionLogStartedAt && !opts.sessionLogCompletedAt) {
    return { label: "In progress", variant: "in-progress" };
  }

  // Scheduled — check time
  if (scheduledAt) {
    const now = Date.now();
    const end = sessionEndMs(scheduledAt, durationMinutes);

    // Past its scheduled window but not completed
    if (now > end) {
      return { label: "Not logged", variant: "not-logged" };
    }

    // Upcoming or currently within the session window
    if (isNextUpcoming && hasWorkout(displayName)) {
      return { label: "Next", variant: "next" };
    }
    if (hasWorkout(displayName)) {
      return { label: "Applied", variant: "applied" };
    }
    return { label: "Open", variant: "open" };
  }

  // Planned (no scheduled_at) — show honest empty
  return { label: "Planned", variant: "open" };
}
