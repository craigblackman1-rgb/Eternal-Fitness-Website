import { describe, it, expect } from "vitest";
import { deriveSessionPot } from "@/lib/session-pot";

/**
 * BUG-EF-184/182/195 — glance-truth derivations.
 *
 * Three client-record "glance" bugs share a root cause: derivations that
 * read from the wrong field or the wrong scope. These tests reproduce each
 * bug with fixtures and verify the corrected behaviour.
 *
 * BUG-EF-184 — attendance %: the footer used pot.used (includes baseline +
 * charged cancellations) as both the "sessions completed" text AND the
 * attendance denominator. Correct: pot.completed for the text, and
 * completed/(completed+charged+unreviewed) for the rate.
 *
 * BUG-EF-182 — PWA block label: the PWA clients list picked the current
 * block by status ("active" first), which can be stale. Correct: prefer
 * the block containing the nearest upcoming session.
 *
 * BUG-EF-195 — "Next up": the next-session derivation included in-progress
 * sessions. Correct: "next" must be the first upcoming session strictly
 * after now, excluding any in-progress or started session.
 */

type SessionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

function makeSession(overrides: {
  status?: SessionStatus;
  charged_free?: "charged" | "free" | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  parent_session_id?: string | null;
} = {}) {
  return {
    status: overrides.status ?? "planned",
    charged_free: overrides.charged_free ?? null,
    cancelled_at: overrides.cancelled_at ?? null,
    completed_at: overrides.completed_at ?? null,
    parent_session_id: overrides.parent_session_id ?? null,
  };
}

// ── BUG-EF-184: attendance % ─────────────────────────────────────────

describe("BUG-EF-184 — attendance % derivation", () => {
  /**
   * Before the fix, the TrainingSection footer used:
   *   sessionsDone = pot.used (= baselineUsed + completed + charged)
   *   attendanceRate = pot.completed / sessionsDone
   *
   * After the fix:
   *   sessionsCompleted = pot.completed
   *   attendanceDenominator = pot.completed + pot.chargedCancellations + pot.unreviewedCancellations
   *   attendanceRate = sessionsCompleted / attendanceDenominator
   */

  it("Ian — 1 completed session, 0 baseline: attendance = 100%", () => {
    const sessions = [
      makeSession({ status: "completed", completed_at: "2026-09-01T10:00:00Z" }),
      makeSession({ status: "planned" }),
      makeSession({ status: "planned" }),
    ];
    const pot = deriveSessionPot(sessions, 12, 0);

    // pot.completed = 1, pot.used = 1 (0 baseline + 1 completed + 0 charged)
    expect(pot.completed).toBe(1);

    // Attendance formula (post-fix): completed / (completed + charged + unreviewed)
    const attendanceDenominator = pot.completed + pot.chargedCancellations + pot.unreviewedCancellations;
    const attendanceRate = attendanceDenominator > 0
      ? Math.round((pot.completed / attendanceDenominator) * 100)
      : null;

    // 1 / (1 + 0 + 0) = 100%
    expect(attendanceRate).toBe(100);
    expect(pot.completed).toBe(1); // footer text: "1 session completed"
  });

  it("Ian — 1 completed + 1 baseline: old formula gives 50%, new gives 100%", () => {
    const sessions = [
      makeSession({ status: "completed", completed_at: "2026-09-01T10:00:00Z" }),
      makeSession({ status: "planned" }),
    ];
    const pot = deriveSessionPot(sessions, 12, 1); // baseline = 1

    expect(pot.completed).toBe(1);
    expect(pot.used).toBe(2); // 1 baseline + 1 completed

    // OLD (wrong): pot.completed / pot.used = 1/2 = 50%
    const oldRate = Math.round((pot.completed / pot.used) * 100);
    expect(oldRate).toBe(50); // this was the bug

    // NEW (correct): pot.completed / (pot.completed + charged + unreviewed) = 1/1 = 100%
    const attendanceDenominator = pot.completed + pot.chargedCancellations + pot.unreviewedCancellations;
    const newRate = Math.round((pot.completed / attendanceDenominator) * 100);
    expect(newRate).toBe(100);
  });

  it("3 completed, 1 charged, 2 unreviewed: attendance = 50%", () => {
    const sessions = [
      makeSession({ status: "completed", completed_at: "2026-09-01T10:00:00Z" }),
      makeSession({ status: "completed", completed_at: "2026-09-02T10:00:00Z" }),
      makeSession({ status: "completed", completed_at: "2026-09-03T10:00:00Z" }),
      makeSession({ status: "cancelled", charged_free: "charged", cancelled_at: "2026-09-04T10:00:00Z" }),
      makeSession({ status: "cancelled", charged_free: null, cancelled_at: "2026-09-05T10:00:00Z" }),
      makeSession({ status: "cancelled", charged_free: null, cancelled_at: "2026-09-06T10:00:00Z" }),
    ];
    const pot = deriveSessionPot(sessions, 12, 0);

    expect(pot.completed).toBe(3);
    expect(pot.chargedCancellations).toBe(1);
    expect(pot.unreviewedCancellations).toBe(2);

    const attendanceDenominator = pot.completed + pot.chargedCancellations + pot.unreviewedCancellations;
    const attendanceRate = attendanceDenominator > 0
      ? Math.round((pot.completed / attendanceDenominator) * 100)
      : null;

    // 3 / (3 + 1 + 2) = 3/6 = 50%
    expect(attendanceRate).toBe(50);
  });

  it("0 completed, 0 charged, 0 unreviewed: attendance = null", () => {
    const sessions = [
      makeSession({ status: "planned" }),
      makeSession({ status: "planned" }),
    ];
    const pot = deriveSessionPot(sessions, 12, 0);

    expect(pot.completed).toBe(0);
    const attendanceDenominator = pot.completed + pot.chargedCancellations + pot.unreviewedCancellations;
    const attendanceRate = attendanceDenominator > 0
      ? Math.round((pot.completed / attendanceDenominator) * 100)
      : null;

    expect(attendanceRate).toBeNull();
  });

  it("sub-sessions excluded from attendance count", () => {
    const sessions = [
      makeSession({ status: "completed", completed_at: "2026-09-01T10:00:00Z" }),
      makeSession({ status: "completed", completed_at: "2026-09-02T10:00:00Z", parent_session_id: "parent-1" }),
      makeSession({ status: "planned" }),
    ];
    const pot = deriveSessionPot(sessions, 12, 0);

    // Only 1 main session completed (the sub-session is excluded)
    expect(pot.completed).toBe(1);

    const attendanceDenominator = pot.completed + pot.chargedCancellations + pot.unreviewedCancellations;
    const attendanceRate = attendanceDenominator > 0
      ? Math.round((pot.completed / attendanceDenominator) * 100)
      : null;
    expect(attendanceRate).toBe(100);
  });
});

// ── BUG-EF-182: PWA block label ──────────────────────────────────────

describe("BUG-EF-182 — PWA block selection", () => {
  /**
   * The PWA clients list (page.tsx) must pick the block containing the
   * nearest upcoming session, not the first by stored status.
   *
   * Fixture: client with block A (older, ending Nov, status "active")
   * and block B (newer, sessions on 15 & 22 Sept).
   */

  interface BlockRow {
    id: string;
    client_id: string;
    block_number: number;
    status: string;
    title: string | null;
  }

  interface SessionRow {
    id: string;
    block_id: string;
    scheduled_at: string | null;
    cancelled_at: string | null;
    parent_session_id?: string | null;
  }

  /**
   * Replicates the post-fix block selection logic from page.tsx:
   * prefer the block containing the nearest upcoming session,
   * fall back to status-based selection.
   */
  function findCurrentBlock(
    clientBlocks: BlockRow[],
    clientSessions: SessionRow[],
    now: Date,
  ): BlockRow | undefined {
    const sorted = [...clientBlocks].sort((a, b) => b.block_number - a.block_number);

    // BUG-EF-182 fix: prefer the block with the nearest upcoming session
    const nearestUpcomingBlockId = clientSessions
      .filter((s) => s.scheduled_at && !s.cancelled_at && !s.parent_session_id)
      .filter((s) => new Date(s.scheduled_at!).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0]?.block_id ?? null;

    return (nearestUpcomingBlockId ? sorted.find((b) => b.id === nearestUpcomingBlockId) : null)
      ?? sorted.find((b) => b.status === "active")
      ?? sorted.find((b) => b.status === "approved")
      ?? sorted[0];
  }

  it("picks the block with upcoming sessions over an older 'active' block", () => {
    const now = new Date("2026-09-14T12:00:00Z");

    const blocks: BlockRow[] = [
      // Block 3 (newer) — Sept sessions, status might be "approved" or not "active"
      { id: "block-3", client_id: "c1", block_number: 3, status: "approved", title: "Sep block" },
      // Block 2 (older) — Nov sessions, status "active" (stale)
      { id: "block-2", client_id: "c1", block_number: 2, status: "active", title: "Nov block" },
    ];

    const sessions: SessionRow[] = [
      // Block 3: sessions on 15 & 22 Sept (upcoming from Sep 14)
      { id: "s1", block_id: "block-3", scheduled_at: "2026-09-15T10:00:00Z", cancelled_at: null },
      { id: "s2", block_id: "block-3", scheduled_at: "2026-09-22T10:00:00Z", cancelled_at: null },
      // Block 2: sessions in November
      { id: "s3", block_id: "block-2", scheduled_at: "2026-11-01T10:00:00Z", cancelled_at: null },
      { id: "s4", block_id: "block-2", scheduled_at: "2026-11-08T10:00:00Z", cancelled_at: null },
    ];

    const current = findCurrentBlock(blocks, sessions, now);

    // BUG-EF-182: must pick block-3 (Sept), not block-2 (Nov, stale "active")
    expect(current?.id).toBe("block-3");
  });

  it("falls back to status when no upcoming sessions exist", () => {
    const now = new Date("2026-12-01T12:00:00Z");

    const blocks: BlockRow[] = [
      { id: "block-2", client_id: "c1", block_number: 2, status: "active", title: "Done block" },
      { id: "block-1", client_id: "c1", block_number: 1, status: "complete", title: "Old block" },
    ];

    const sessions: SessionRow[] = [
      // All sessions are in the past
      { id: "s1", block_id: "block-2", scheduled_at: "2026-09-15T10:00:00Z", cancelled_at: null },
    ];

    const current = findCurrentBlock(blocks, sessions, now);

    // No upcoming sessions → fall back to "active" status
    expect(current?.id).toBe("block-2");
  });

  it("picks the block with the soonest session when multiple blocks have upcoming", () => {
    const now = new Date("2026-09-14T12:00:00Z");

    const blocks: BlockRow[] = [
      { id: "block-b", client_id: "c1", block_number: 2, status: "approved", title: "Block B" },
      { id: "block-a", client_id: "c1", block_number: 1, status: "active", title: "Block A" },
    ];

    const sessions: SessionRow[] = [
      // Block A: session tomorrow
      { id: "s1", block_id: "block-a", scheduled_at: "2026-09-15T10:00:00Z", cancelled_at: null },
      // Block B: session next week
      { id: "s2", block_id: "block-b", scheduled_at: "2026-09-22T10:00:00Z", cancelled_at: null },
    ];

    const current = findCurrentBlock(blocks, sessions, now);

    // Block A has the sooner session (Sept 15), so it wins
    expect(current?.id).toBe("block-a");
  });
});

// ── BUG-EF-195: "Next up" excludes in-progress ───────────────────────

describe("BUG-EF-195 — next session derivation", () => {
  /**
   * The "Next up" glance must never name a session that is already in
   * progress or whose start has passed. "Next" is the first upcoming
   * booking strictly after now (or after the in-progress one).
   */

  interface Booking {
    id: string;
    scheduled_at: string;
    status?: string;
    started_at?: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
    parent_session_id?: string | null;
    data?: { versions?: { studio?: { warm_up?: unknown[]; main_block?: unknown[]; cooldown?: unknown[] } } };
  }

  /**
   * Replicates the post-fix next-session derivation from TrainingSection.tsx:
   * upcomingBookings.find(s => !in_progress && !started_at && hasWorkout ...)
   */
  function findNextSession(
    blockSessions: Booking[],
    now: Date,
  ): Booking | undefined {
    const upcoming = blockSessions
      .filter(
        (s) =>
          !s.completed_at &&
          !s.parent_session_id &&
          !s.cancelled_at &&
          s.scheduled_at &&
          (s.status === "in_progress" || s.started_at || new Date(s.scheduled_at).getTime() >= now.getTime()),
      )
      .sort(
        (a, b) => {
          const aInProgress = a.status === "in_progress" || !!a.started_at;
          const bInProgress = b.status === "in_progress" || !!b.started_at;
          if (aInProgress && !bInProgress) return -1;
          if (!aInProgress && bInProgress) return 1;
          return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
        },
      );

    // BUG-EF-195 fix: exclude in-progress/started sessions from "next"
    return upcoming.find(
      (s) => !(s.status === "in_progress" || !!s.started_at),
    );
  }

  it("skips the in-progress session and picks the next upcoming one", () => {
    const now = new Date("2026-09-14T10:00:00Z");

    const sessions: Booking[] = [
      // In progress right now (scheduled at 09:00, started)
      {
        id: "s1",
        scheduled_at: "2026-09-14T09:00:00Z",
        status: "in_progress",
        started_at: "2026-09-14T09:05:00Z",
      },
      // Later today (scheduled at 14:00)
      {
        id: "s2",
        scheduled_at: "2026-09-14T14:00:00Z",
        status: "scheduled",
      },
      // Tomorrow
      {
        id: "s3",
        scheduled_at: "2026-09-15T10:00:00Z",
        status: "scheduled",
      },
    ];

    const next = findNextSession(sessions, now);

    // BUG-EF-195: must be s2 (later today), not s1 (in progress)
    expect(next?.id).toBe("s2");
  });

  it("skips a session with started_at set but no in_progress status", () => {
    const now = new Date("2026-09-14T10:00:00Z");

    const sessions: Booking[] = [
      // Started (first set logged) but not formally "in_progress"
      {
        id: "s1",
        scheduled_at: "2026-09-14T09:00:00Z",
        status: "scheduled",
        started_at: "2026-09-14T09:05:00Z",
      },
      // Tomorrow
      {
        id: "s2",
        scheduled_at: "2026-09-15T10:00:00Z",
        status: "scheduled",
      },
    ];

    const next = findNextSession(sessions, now);

    // s1 has started_at set → excluded from "next"
    expect(next?.id).toBe("s2");
  });

  it("returns undefined when all sessions are completed or in-progress", () => {
    const now = new Date("2026-09-14T10:00:00Z");

    const sessions: Booking[] = [
      {
        id: "s1",
        scheduled_at: "2026-09-14T09:00:00Z",
        status: "in_progress",
        started_at: "2026-09-14T09:05:00Z",
      },
      {
        id: "s2",
        scheduled_at: "2026-09-13T10:00:00Z",
        completed_at: "2026-09-13T11:00:00Z",
      },
    ];

    const next = findNextSession(sessions, now);
    expect(next).toBeUndefined();
  });

  it("picks the first non-in-progress session when only one is upcoming", () => {
    const now = new Date("2026-09-14T10:00:00Z");

    const sessions: Booking[] = [
      {
        id: "s1",
        scheduled_at: "2026-09-14T09:00:00Z",
        status: "in_progress",
        started_at: "2026-09-14T09:05:00Z",
      },
      {
        id: "s2",
        scheduled_at: "2026-09-15T10:00:00Z",
        status: "scheduled",
      },
    ];

    const next = findNextSession(sessions, now);
    expect(next?.id).toBe("s2");
  });
});
