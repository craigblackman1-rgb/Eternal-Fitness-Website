import { deriveSessionStatus } from "./session-status";
import { deriveSessionPot } from "./session-pot";
import { toIsoTimestamp } from "./pg-timestamp";

/* ── Pure pot ledger builder ──────────────────────────────────────────
 * Extracted from route.ts so it can be unit-tested without a DB.
 * Takes session data + client fields, returns { consumption, ledger }.
 */

export interface SessionData {
  id: string;
  status: string | null;
  cancelled_at: string | null;
  charged_free: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  parent_session_id: string | null;
  block_id: string;
  session_number: number | null;
  data: Record<string, unknown> | null;
}

export interface Extension {
  from: string;
  to: string;
  at: string;
  reason?: string;
}

export interface LedgerEntry {
  date: string;
  event: string;
  delta: number | null;
  remaining: number | null;
  used?: number;
  tags: string[];
}

export interface PotLedgerInput {
  sessions: SessionData[];
  purchased: number | null;
  start_date: string | null;
  block_expiry_date: string | null;
  block_expiry_extensions: Extension[];
  pot_baseline_used: number;
  pot_baseline_at: string | null;
}

export interface PotLedgerConsumption {
  completed: number;
  cancelled_free: number;
  cancelled_charged: number;
  rescheduled: number;
  no_show: number;
  remaining: number | null;
  purchased: number | null;
  baseline_used: number;
  used: number;
  ongoing: boolean;
}

export interface PotLedgerResult {
  consumption: PotLedgerConsumption;
  ledger: LedgerEntry[];
}

/** Rank events for deterministic sort: package-start → baseline → session activity → extension → expiry. */
function eventRank(e: { event: string; tags: string[] }): number {
  if (e.event.startsWith("Package started")) return 0;
  if (e.event.startsWith("Before the hub")) return 1;
  if (e.event.startsWith("Session completed")) return 2;
  if (e.event.startsWith("Session cancelled")) return 2;
  if (e.event.startsWith("Expiry extended")) return 3;
  if (e.event === "Package expired") return 4;
  return 5;
}

export function buildPotLedger(input: PotLedgerInput): PotLedgerResult {
  const {
    sessions,
    purchased,
    start_date,
    block_expiry_date,
    block_expiry_extensions,
    pot_baseline_used,
    pot_baseline_at,
  } = input;

  const extensions = block_expiry_extensions ?? [];
  const baselineUsed = pot_baseline_used ?? 0;

  // ── Count session categories ──────────────────────────────────────
  // Sub-sessions (parent_session_id) are excluded per CR-EF-101.
  // NULL charged_free is never treated as "charged" (never-guess rule).
  let completed = 0;
  let cancelledFree = 0;
  let cancelledCharged = 0;
  let rescheduled = 0;
  let noShow = 0;

  for (const s of sessions ?? []) {
    if (s.parent_session_id) continue;
    const sStatus = deriveSessionStatus({ ...s, session_log: (s.data as Record<string, unknown> | null)?.session_log });
    if (sStatus === "completed") {
      completed++;
    } else if (sStatus === "cancelled") {
      if (s.charged_free === "free") {
        cancelledFree++;
      } else if (s.charged_free === "charged") {
        cancelledCharged++;
      }
      if (s.scheduled_at && s.cancelled_at && new Date(s.scheduled_at) > new Date(s.cancelled_at)) {
        rescheduled++;
      }
    } else if (s.status === "scheduled" && s.scheduled_at) {
      const scheduledDate = new Date(s.scheduled_at);
      if (scheduledDate < new Date() && !s.completed_at) {
        noShow++;
      }
    }
  }

  // ── Build all events ──────────────────────────────────────────────
  // BUG-EF-144 — Date package started from the pot/package creation
  // (purchase) date, not the first booking. Fall back to earliest session
  // only when no purchase date exists, and say so in the row label.
  let packageStartDate: string | null = start_date ?? null;
  let packageStartFallback = false;

  if (!packageStartDate) {
    let earliestScheduled: string | null = null;
    for (const s of sessions ?? []) {
      if (s.parent_session_id) continue;
      if (s.scheduled_at && (!earliestScheduled || s.scheduled_at < earliestScheduled)) {
        earliestScheduled = s.scheduled_at;
      }
    }
    if (earliestScheduled) {
      packageStartDate = earliestScheduled;
      packageStartFallback = true;
    }
  }

  const events: { date: string; event: string; delta: number | null; tags: string[]; rank: number }[] = [];

  if (packageStartDate) {
    events.push({
      date: toIsoTimestamp(packageStartDate) ?? packageStartDate,
      event: purchased != null
        ? `Package started — ${purchased} sessions`
        : packageStartFallback
          ? "Ongoing — started from first booking (no purchase date on file)"
          : "Ongoing package — no session cap",
      delta: purchased,
      tags: [],
      rank: 0,
    });
  }

  // BUG-EF-144 — Pre-hub baseline: use pot_baseline_at directly, not
  // +1ms after package start. The +1ms hack made the baseline sort above
  // the package started row in the desc table.
  if (baselineUsed > 0) {
    const baselineDate = pot_baseline_at
      ? (toIsoTimestamp(pot_baseline_at) ?? pot_baseline_at)
      : packageStartDate
        ? (toIsoTimestamp(packageStartDate) ?? packageStartDate)
        : new Date(0).toISOString();
    events.push({
      date: baselineDate,
      event: `Before the hub — ${baselineUsed} sessions used (Trainerize)`,
      delta: -baselineUsed,
      tags: [],
      rank: 1,
    });
  }

  // Extension events
  for (const ext of extensions) {
    events.push({
      date: toIsoTimestamp(ext.at) ?? ext.at,
      event: `Expiry extended ${ext.from} → ${ext.to}${ext.reason ? ` (${ext.reason})` : ""}`,
      delta: null,
      tags: [],
      rank: 3,
    });
  }

  // Session events — sub-sessions excluded per CR-EF-101.
  for (const s of sessions ?? []) {
    if (s.parent_session_id) continue;
    const sStatus = deriveSessionStatus({ ...s, session_log: (s.data as Record<string, unknown> | null)?.session_log });
    if (sStatus === "completed" && s.completed_at) {
      events.push({
        date: toIsoTimestamp(s.completed_at) ?? s.completed_at,
        event: "Session completed",
        delta: -1,
        tags: [],
        rank: 2,
      });
    } else if (sStatus === "cancelled" && s.cancelled_at) {
      const isFree = s.charged_free === "free";
      const isCharged = s.charged_free === "charged";
      events.push({
        date: toIsoTimestamp(s.cancelled_at) ?? s.cancelled_at,
        event: isFree ? "Session cancelled (free)" : isCharged ? "Session cancelled (charged)" : "Session cancelled",
        delta: isCharged ? -1 : null,
        tags: isFree ? ["Free"] : [],
        rank: 2,
      });
    }
  }

  // Package expiry event
  if (block_expiry_date) {
    events.push({
      date: toIsoTimestamp(block_expiry_date) ?? block_expiry_date,
      event: "Package expired",
      delta: null,
      tags: [],
      rank: 4,
    });
  }

  // ── Sort ascending with deterministic tie-break ────────────────────
  // BUG-EF-144 — normalise every date through toIsoTimestamp at push time;
  // sort by explicit numeric ms + event rank for deterministic order.
  events.sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (diff !== 0) return diff;
    return a.rank - b.rank;
  });

  // Walk computing remaining (capped) or used (ongoing) in ascending order
  const isOngoing = purchased === null;
  let runningCount = 0;
  const sorted: LedgerEntry[] = events.map((e) => {
    if (isOngoing) {
      if (e.delta != null && e.delta < 0) {
        runningCount -= e.delta;
      }
      return { date: e.date, event: e.event, delta: e.delta, remaining: null, used: runningCount, tags: e.tags };
    } else {
      runningCount =
        e.delta !== null ? Math.max(0, runningCount + e.delta) : runningCount;
      return { date: e.date, event: e.event, delta: e.delta, remaining: runningCount, tags: e.tags };
    }
  });

  // ── Collapse consecutive free-cancel no-ops BEFORE reverse ─────────
  // BUG-EF-144 — collapsed row carries the run's EARLIEST date and the
  // LAST row's remaining (they're identical since delta is null for all).
  const collapsed: LedgerEntry[] = [];
  let ci = 0;
  while (ci < sorted.length) {
    if (
      sorted[ci].delta === null &&
      sorted[ci].tags.includes("Free") &&
      sorted[ci].event.startsWith("Session cancelled")
    ) {
      let count = 1;
      let j = ci + 1;
      while (
        j < sorted.length &&
        sorted[j].delta === null &&
        sorted[j].tags.includes("Free") &&
        sorted[j].event.startsWith("Session cancelled")
      ) {
        count++;
        j++;
      }
      collapsed.push({
        date: sorted[ci].date,
        event: count === 1 ? "Session cancelled (free)" : `${sorted[ci].event} × ${count}`,
        delta: null,
        remaining: sorted[j - 1].remaining,
        used: sorted[j - 1].used,
        tags: ["Free"],
      });
      ci = j;
    } else {
      collapsed.push(sorted[ci]);
      ci++;
    }
  }

  // Reverse for newest-first display
  const ledger = collapsed.reverse();

  // Consumption summary — deriveSessionPot for the canonical remaining/used
  const derivedPot = sessions.length > 0
    ? deriveSessionPot(sessions as any, purchased, baselineUsed)
    : null;

  // BUG-EF-148 — When purchased is not null, remaining must always be a
  // number (never null). deriveSessionPot returns null remaining only when
  // purchased is null, but when sessions is empty derivedPot is null too,
  // so fall back to a direct computation.
  const consumption: PotLedgerConsumption = {
    completed,
    cancelled_free: cancelledFree,
    cancelled_charged: cancelledCharged,
    rescheduled,
    no_show: noShow,
    remaining: derivedPot?.remaining ?? (purchased != null ? Math.max(purchased - (baselineUsed + completed + cancelledCharged), 0) : null),
    purchased,
    baseline_used: baselineUsed,
    used: derivedPot?.used ?? (baselineUsed + completed + cancelledCharged),
    ongoing: isOngoing,
  };

  return { consumption, ledger };
}
