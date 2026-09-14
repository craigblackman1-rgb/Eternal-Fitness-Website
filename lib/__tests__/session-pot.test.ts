import { describe, it, expect } from "vitest";
import { deriveSessionPot } from "@/lib/session-pot";

type SessionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/**
 * BUG-EF-142 — deriveSessionPot must subtract pot_baseline_used so that
 * sessions consumed before the hub existed are not double-counted.
 *
 * Fixture data:
 *   Emma — baseline_used = 5, purchased = 24, 8 completed + 1 charged cancel
 *          remaining should be 24 - (5 + 8 + 1) = 10
 *   Ian  — baseline_used = 0 (or undefined), purchased = 12, 3 completed
 *          remaining should be 12 - (0 + 3) = 9
 */

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

describe("deriveSessionPot", () => {
  // ── Emma: baseline_used > 0 ──────────────────────────────────────

  describe("Emma — baseline_used = 5", () => {
    const sessions = [
      // 8 completed sessions
      ...Array.from({ length: 8 }, (_, i) =>
        makeSession({ status: "completed", completed_at: `2026-01-${String(i + 1).padStart(2, "0")}T10:00:00Z` }),
      ),
      // 1 charged cancellation (consumes a slot)
      makeSession({ status: "cancelled", charged_free: "charged", cancelled_at: "2026-01-10T10:00:00Z" }),
      // 1 free cancellation (does NOT consume a slot)
      makeSession({ status: "cancelled", charged_free: "free", cancelled_at: "2026-01-11T10:00:00Z" }),
      // 1 unreviewed cancellation (does NOT consume a slot)
      makeSession({ status: "cancelled", charged_free: null, cancelled_at: "2026-01-12T10:00:00Z" }),
      // 2 planned sessions
      makeSession({ status: "planned" }),
      makeSession({ status: "planned" }),
    ];

    it("subtracts baseline_used from remaining", () => {
      const pot = deriveSessionPot(sessions, 24, 5);
      // used = 5 (baseline) + 8 (completed) + 1 (charged) = 14
      // remaining = 24 - 14 = 10
      expect(pot.used).toBe(14);
      expect(pot.remaining).toBe(10);
    });

    it("would overstate remaining if baseline_used were ignored", () => {
      const potWithoutBaseline = deriveSessionPot(sessions, 24, 0);
      // used = 0 + 8 + 1 = 9
      // remaining = 24 - 9 = 15 (WRONG — overstates by 5)
      expect(potWithoutBaseline.used).toBe(9);
      expect(potWithoutBaseline.remaining).toBe(15);

      const potWithBaseline = deriveSessionPot(sessions, 24, 5);
      expect(potWithBaseline.remaining).toBe(10);
      // The difference is exactly the baseline_used
      expect(potWithoutBaseline.remaining! - potWithBaseline.remaining).toBe(5);
    });

    it("clamps remaining at 0 when baseline + usage exceeds purchased", () => {
      const pot = deriveSessionPot(sessions, 10, 5);
      // used = 5 + 8 + 1 = 14; remaining = max(10 - 14, 0) = 0
      expect(pot.used).toBe(14);
      expect(pot.remaining).toBe(0);
    });

    it("counts completed, chargedCancellations, freeCancellations, unreviewedCancellations correctly", () => {
      const pot = deriveSessionPot(sessions, 24, 5);
      expect(pot.completed).toBe(8);
      expect(pot.chargedCancellations).toBe(1);
      expect(pot.freeCancellations).toBe(1);
      expect(pot.unreviewedCancellations).toBe(1);
    });
  });

  // ── Ian: baseline_used = 0 / undefined ───────────────────────────

  describe("Ian — baseline_used = 0 (or undefined)", () => {
    const sessions = [
      makeSession({ status: "completed", completed_at: "2026-02-01T10:00:00Z" }),
      makeSession({ status: "completed", completed_at: "2026-02-02T10:00:00Z" }),
      makeSession({ status: "completed", completed_at: "2026-02-03T10:00:00Z" }),
      makeSession({ status: "planned" }),
      makeSession({ status: "planned" }),
      makeSession({ status: "planned" }),
      makeSession({ status: "planned" }),
      makeSession({ status: "planned" }),
      makeSession({ status: "planned" }),
    ];

    it("produces correct remaining with baseline_used = 0", () => {
      const pot = deriveSessionPot(sessions, 12, 0);
      // used = 0 + 3 + 0 = 3; remaining = 12 - 3 = 9
      expect(pot.used).toBe(3);
      expect(pot.remaining).toBe(9);
    });

    it("produces correct remaining when baseline_used is not passed (default 0)", () => {
      const pot = deriveSessionPot(sessions, 12);
      // Same result — default baselineUsed = 0
      expect(pot.used).toBe(3);
      expect(pot.remaining).toBe(9);
    });

    it("remaining matches the no-baseline case (no overstatement)", () => {
      const potWithZero = deriveSessionPot(sessions, 12, 0);
      const potWithDefault = deriveSessionPot(sessions, 12);
      expect(potWithZero.remaining).toBe(potWithDefault.remaining);
      expect(potWithZero.remaining).toBe(9);
    });
  });

  // ── Sub-session exclusion (CR-EF-101) ────────────────────────────

  describe("sub-session exclusion", () => {
    it("excludes sub-sessions from the pot count", () => {
      const sessions = [
        makeSession({ status: "completed", completed_at: "2026-03-01T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-03-02T10:00:00Z", parent_session_id: "parent-uuid" }),
        makeSession({ status: "completed", completed_at: "2026-03-03T10:00:00Z", parent_session_id: "parent-uuid" }),
        makeSession({ status: "cancelled", charged_free: "charged", cancelled_at: "2026-03-04T10:00:00Z", parent_session_id: "parent-uuid" }),
        makeSession({ status: "planned" }),
        makeSession({ status: "planned", parent_session_id: "parent-uuid" }),
      ];
      const pot = deriveSessionPot(sessions, 12, 0);
      // Only 1 completed (not the 2 sub-sessions), 0 charged (sub-session excluded)
      expect(pot.completed).toBe(1);
      expect(pot.chargedCancellations).toBe(0);
      expect(pot.used).toBe(1);
      expect(pot.remaining).toBe(11);
    });
  });

  // ── Estimated remaining (purchased = null) ────────────────────────

  describe("estimated remaining when purchased is null", () => {
    it("does not subtract baseline_used from estimatedRemaining", () => {
      const sessions = [
        makeSession({ status: "completed", completed_at: "2026-04-01T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-04-02T10:00:00Z" }),
        makeSession({ status: "planned" }),
      ];
      const pot = deriveSessionPot(sessions, null, 5);
      // estimatedPurchase = 3 (row count), completed = 2, charged = 0
      // estimatedRemaining = 3 - 2 = 1 (baseline NOT applied to estimate)
      expect(pot.purchased).toBeNull();
      expect(pot.estimatedPurchase).toBe(3);
      expect(pot.estimatedRemaining).toBe(1);
      expect(pot.remaining).toBeNull();
    });
  });

  // ── Empty sessions ────────────────────────────────────────────────

  describe("empty session list", () => {
    it("returns all-zero counts with purchased intact", () => {
      const pot = deriveSessionPot([], 12, 3);
      expect(pot.completed).toBe(0);
      expect(pot.chargedCancellations).toBe(0);
      expect(pot.freeCancellations).toBe(0);
      expect(pot.unreviewedCancellations).toBe(0);
      // used = 3 (baseline) + 0 + 0 = 3; remaining = 12 - 3 = 9
      expect(pot.used).toBe(3);
      expect(pot.remaining).toBe(9);
    });
  });
});
