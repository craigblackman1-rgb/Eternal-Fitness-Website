import { describe, it, expect } from "vitest";
import { buildPotLedger } from "@/lib/pot-ledger";
import type { SessionData, PotLedgerInput } from "@/lib/pot-ledger";

/**
 * BUG-EF-144 + BUG-EF-148 — pot ledger ordering and ongoing-client tests.
 *
 * These tests exercise the pure builder (buildPotLedger) extracted from
 * route.ts so they can run without a DB.
 */

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
  return {
    id: overrides.id ?? `s-${Math.random().toString(36).slice(2, 8)}`,
    status: overrides.status ?? "planned",
    cancelled_at: overrides.cancelled_at ?? null,
    charged_free: overrides.charged_free ?? null,
    scheduled_at: overrides.scheduled_at ?? null,
    completed_at: overrides.completed_at ?? null,
    parent_session_id: overrides.parent_session_id ?? null,
    block_id: overrides.block_id ?? "block-1",
    session_number: overrides.session_number ?? null,
    data: overrides.data ?? null,
  };
}

function baseInput(overrides: Partial<PotLedgerInput> = {}): PotLedgerInput {
  return {
    sessions: [],
    purchased: 12,
    start_date: "2026-09-01",
    block_expiry_date: null,
    block_expiry_extensions: [],
    pot_baseline_used: 0,
    pot_baseline_at: null,
    ...overrides,
  };
}

// ── BUG-EF-144 — ASC ordering with baseline ───────────────────────

describe("pot-ledger ordering", () => {
  it("sorts events chronologically ASC: package start before baseline before sessions", () => {
    const input = baseInput({
      sessions: [
        makeSession({ status: "completed", completed_at: "2026-09-03T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-09-05T10:00:00Z" }),
      ],
      pot_baseline_used: 2,
      pot_baseline_at: "2026-09-02T09:00:00Z",
    });

    const { ledger } = buildPotLedger(input);

    // Ledger is reversed for desc display, so un-reverse to check ASC order
    const asc = [...ledger].reverse();

    // ASC: package start → baseline → session 1 → session 2
    expect(asc[0].event).toMatch(/^Package started/);
    expect(asc[1].event).toMatch(/^Before the hub/);
    expect(asc[2].event).toBe("Session completed");
    expect(asc[3].event).toBe("Session completed");

    // Dates should be strictly non-decreasing
    for (let i = 1; i < asc.length; i++) {
      expect(new Date(asc[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(asc[i - 1].date).getTime(),
      );
    }
  });

  it("package start date uses start_date (purchase date), not earliest session", () => {
    const input = baseInput({
      sessions: [
        makeSession({ status: "completed", completed_at: "2026-09-07T10:00:00Z" }),
      ],
      start_date: "2026-09-01",
    });

    const { ledger } = buildPotLedger(input);
    const asc = [...ledger].reverse();

    // Package started should be dated from start_date, not Sept 7
    expect(asc[0].event).toMatch(/^Package started/);
    expect(asc[0].date).toContain("2026-09-01");
  });

  it("future-dated package start does NOT sort above earlier session rows", () => {
    // BUG-EF-144 — a 9 Sept start shown on 8 Sept above 7 Sept rows
    const input = baseInput({
      sessions: [
        makeSession({ status: "completed", completed_at: "2026-09-07T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-09-08T10:00:00Z" }),
      ],
      start_date: "2026-09-09",
    });

    const { ledger } = buildPotLedger(input);
    const asc = [...ledger].reverse();

    // Sept 7 session should come BEFORE Sept 9 package start in ASC
    const sept7Idx = asc.findIndex((e) => e.date.includes("2026-09-07"));
    const sept9PkgIdx = asc.findIndex((e) => e.event.startsWith("Package started"));
    expect(sept7Idx).toBeGreaterThanOrEqual(0);
    expect(sept9PkgIdx).toBeGreaterThanOrEqual(0);
    expect(sept7Idx).toBeLessThan(sept9PkgIdx);
  });

  it("running remaining is correct when sessions precede the package start", () => {
    // Sessions on Sept 7 and 8, package starts Sept 9, baseline 2
    const input = baseInput({
      sessions: [
        makeSession({ status: "completed", completed_at: "2026-09-07T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-09-08T10:00:00Z" }),
      ],
      purchased: 12,
      start_date: "2026-09-09",
      pot_baseline_used: 2,
      pot_baseline_at: "2026-09-09T09:00:00Z",
    });

    const { ledger } = buildPotLedger(input);
    const asc = [...ledger].reverse();

    // ASC: Sept 7 session (remaining=0, before package), Sept 8 (0), package (12), baseline (10)
    // In desc display: baseline=10, package=12, Sept 8=0, Sept 7=0
    // The sessions before the package start show 0 remaining (they consumed
    // before the pot existed — that's correct for this data shape)
    const baselineRow = asc.find((e) => e.event.startsWith("Before the hub"))!;
    expect(baselineRow.remaining).toBe(10); // 12 - 2

    const pkgRow = asc.find((e) => e.event.startsWith("Package started"))!;
    expect(pkgRow.remaining).toBe(12);
  });

  it("baseline uses pot_baseline_at directly, not +1ms after package start", () => {
    const input = baseInput({
      pot_baseline_used: 3,
      pot_baseline_at: "2026-09-06T14:00:00Z",
      start_date: "2026-09-01",
    });

    const { ledger } = buildPotLedger(input);
    const asc = [...ledger].reverse();

    const baselineRow = asc.find((e) => e.event.startsWith("Before the hub"))!;
    // Should be the exact pot_baseline_at date, not packageStartDate + 1ms
    expect(baselineRow.date).toContain("2026-09-06");
  });
});

// ── BUG-EF-144 — consecutive free cancel collapse ─────────────────

describe("free cancel collapse", () => {
  it("collapses N consecutive free cancels into one row with × N", () => {
    const input = baseInput({
      sessions: [
        makeSession({ status: "cancelled", charged_free: "free", cancelled_at: "2026-09-10T10:00:00Z" }),
        makeSession({ status: "cancelled", charged_free: "free", cancelled_at: "2026-09-11T10:00:00Z" }),
        makeSession({ status: "cancelled", charged_free: "free", cancelled_at: "2026-09-12T10:00:00Z" }),
      ],
    });

    const { ledger } = buildPotLedger(input);

    // Should collapse to one row (plus the package start)
    const freeRows = ledger.filter((e) => e.tags.includes("Free"));
    expect(freeRows).toHaveLength(1);
    expect(freeRows[0].event).toBe("Session cancelled (free) × 3");
  });

  it("does NOT collapse free cancels separated by non-free events", () => {
    const input = baseInput({
      sessions: [
        makeSession({ status: "cancelled", charged_free: "free", cancelled_at: "2026-09-10T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-09-11T10:00:00Z" }),
        makeSession({ status: "cancelled", charged_free: "free", cancelled_at: "2026-09-12T10:00:00Z" }),
      ],
    });

    const { ledger } = buildPotLedger(input);

    // Two separate free-cancel rows (not collapsed because separated by completed)
    const freeRows = ledger.filter((e) => e.tags.includes("Free"));
    expect(freeRows).toHaveLength(2);
    expect(freeRows[0].event).toBe("Session cancelled (free)");
    expect(freeRows[1].event).toBe("Session cancelled (free)");
  });

  it("single free cancel keeps original label", () => {
    const input = baseInput({
      sessions: [
        makeSession({ status: "cancelled", charged_free: "free", cancelled_at: "2026-09-10T10:00:00Z" }),
      ],
    });

    const { ledger } = buildPotLedger(input);
    const freeRows = ledger.filter((e) => e.tags.includes("Free"));
    expect(freeRows).toHaveLength(1);
    expect(freeRows[0].event).toBe("Session cancelled (free)");
  });
});

// ── BUG-EF-148 — ongoing client (purchased=null) ──────────────────

describe("ongoing clients (purchased=null)", () => {
  it("returns null remaining and no NaN", () => {
    const input = baseInput({
      purchased: null,
      sessions: [
        makeSession({ status: "completed", completed_at: "2026-09-01T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-09-02T10:00:00Z" }),
      ],
    });

    const { consumption, ledger } = buildPotLedger(input);

    expect(consumption.purchased).toBeNull();
    expect(consumption.remaining).toBeNull();
    expect(consumption.ongoing).toBe(true);
    expect(consumption.used).toBe(2);

    // No NaN in ledger
    for (const entry of ledger) {
      expect(entry.remaining).toBeNull();
      expect(typeof entry.used).toBe("number");
      expect(Number.isNaN(entry.used!)).toBe(false);
    }
  });

  it("ledger rows track used count, not remaining", () => {
    const input = baseInput({
      purchased: null,
      sessions: [
        makeSession({ status: "completed", completed_at: "2026-09-01T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-09-02T10:00:00Z" }),
      ],
    });

    const { ledger } = buildPotLedger(input);

    // All rows should have null remaining and a used count
    for (const entry of ledger) {
      expect(entry.remaining).toBeNull();
      expect(typeof entry.used).toBe("number");
    }

    // The completed sessions should each increment used
    const asc = [...ledger].reverse();
    const completedRows = asc.filter((e) => e.event === "Session completed");
    expect(completedRows).toHaveLength(2);
    expect(completedRows[0].used).toBe(1);
    expect(completedRows[1].used).toBe(2);
  });

  it("package started row says 'Ongoing package' when purchased is null but start_date exists", () => {
    const input = baseInput({
      purchased: null,
      start_date: "2026-09-01",
      sessions: [],
    });

    const { ledger } = buildPotLedger(input);
    const pkgRow = ledger.find((e) => e.event.includes("Ongoing"));
    expect(pkgRow).toBeDefined();
    expect(pkgRow!.event).toContain("no session cap");
  });

  it("no package started event when no start_date and no sessions", () => {
    const input = baseInput({
      purchased: null,
      start_date: null,
      sessions: [],
    });

    const { ledger } = buildPotLedger(input);
    const pkgRow = ledger.find((e) => e.event.includes("Ongoing"));
    expect(pkgRow).toBeUndefined();
    expect(ledger).toHaveLength(0);
  });

  it("falls back to earliest session date with label when no start_date", () => {
    const input = baseInput({
      purchased: null,
      start_date: null,
      sessions: [
        makeSession({ status: "completed", completed_at: "2026-09-05T10:00:00Z", scheduled_at: "2026-09-05T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-09-07T10:00:00Z", scheduled_at: "2026-09-07T10:00:00Z" }),
      ],
    });

    const { ledger } = buildPotLedger(input);
    const pkgRow = ledger.find((e) => e.event.includes("Ongoing"));
    expect(pkgRow).toBeDefined();
    expect(pkgRow!.event).toContain("started from first booking");
    expect(pkgRow!.event).toContain("no purchase date");
    expect(pkgRow!.date).toContain("2026-09-05");
  });
});

// ── Edge cases ────────────────────────────────────────────────────

describe("edge cases", () => {
  it("empty sessions list returns package start only", () => {
    const input = baseInput({ sessions: [] });
    const { ledger } = buildPotLedger(input);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].event).toMatch(/^Package started/);
  });

  it("purchased=0 is NOT treated as ongoing", () => {
    const input = baseInput({ purchased: 0 });
    const { consumption } = buildPotLedger(input);
    expect(consumption.purchased).toBe(0);
    expect(consumption.ongoing).toBe(false);
    expect(consumption.remaining).toBe(0);
  });

  it("sub-sessions excluded from event list", () => {
    const input = baseInput({
      sessions: [
        makeSession({ status: "completed", completed_at: "2026-09-01T10:00:00Z" }),
        makeSession({ status: "completed", completed_at: "2026-09-02T10:00:00Z", parent_session_id: "parent-uuid" }),
      ],
    });

    const { ledger } = buildPotLedger(input);
    const completedRows = ledger.filter((e) => e.event === "Session completed");
    expect(completedRows).toHaveLength(1);
  });
});
