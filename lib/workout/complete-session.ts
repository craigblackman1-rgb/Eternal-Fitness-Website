import type { SessionLog } from "@/types";

/**
 * Result of a session completion attempt.
 *
 * - `success`: session marked complete, `updatedLog` has the new SessionLog.
 * - `off_day`: server rejected because the session is booked for another day;
 *   `scheduledAt` and `scheduledDateLabel` are provided for a confirm dialog.
 * - `already_completed`: the session was already completed (idempotent — treat
 *   as success).
 * - `error`: a real failure.
 */
export type CompleteResult =
  | { kind: "success"; updatedLog: SessionLog }
  | { kind: "off_day"; scheduledAt: string; scheduledDateLabel: string }
  | { kind: "already_completed" }
  | { kind: "error"; message: string };

interface OffDayOption {
  mode: "today" | "booked";
  scheduledAt: string;
}

/**
 * Mark a session as complete via PATCH /api/sessions/[id].
 *
 * Shared by the hub TrainScreen and the portal WorkoutLog. Ported verbatim
 * from TrainScreen.handleComplete (BUG-EF-132 data_merge shape, idempotent
 * read-only guard, off-day confirm flow).
 *
 * The caller handles side-effects after success: updating local refs, clearing
 * drafts, toasting, etc.
 */
export async function completeSession(
  sessionId: string,
  opts: {
    rpe: number | null;
    fatigue: SessionLog["fatigue"];
    notes: string;
    startedAt: string | null;
    exerciseNotes: Record<string, string>;
    offDay?: OffDayOption;
  },
): Promise<CompleteResult> {
  const updatedLog: SessionLog = {
    completed_at:
      opts.offDay?.mode === "booked" ? opts.offDay.scheduledAt : new Date().toISOString(),
    started_at: opts.startedAt ?? null,
    rpe: opts.rpe,
    fatigue: opts.fatigue,
    notes: opts.notes,
  };

  // BUG-EF-132: send only the fields this action owns via data_merge.
  // Never send the whole data blob — a stale mount-time snapshot would
  // clobber any server-side change made mid-session.
  const mergePatch: Record<string, unknown> = {
    session_log: updatedLog,
    exercise_notes: opts.exerciseNotes,
  };
  const body: Record<string, unknown> = { data_merge: mergePatch };
  if (opts.offDay) {
    body.confirm_off_day = true;
    body.off_day_mode = opts.offDay.mode;
  }

  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);

    if (res.status === 409 && err?.code === "off_day_completion") {
      const scheduledDate = new Date(err.scheduledAt).toLocaleDateString("en-GB", {
        timeZone: "Europe/London",
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      return { kind: "off_day", scheduledAt: err.scheduledAt, scheduledDateLabel: scheduledDate };
    }

    // BUG-EF-132: idempotent — if already completed, treat as success
    if (res.status === 403 && err?.error?.includes("read-only")) {
      return { kind: "already_completed" };
    }

    return { kind: "error", message: err?.error || "Failed to mark session complete" };
  }

  return { kind: "success", updatedLog };
}
