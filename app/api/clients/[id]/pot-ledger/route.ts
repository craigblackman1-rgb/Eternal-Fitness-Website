import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { deriveSessionPot } from "@/lib/session-pot";
import { deriveSessionStatus } from "@/lib/session-status";
import { toIsoTimestamp } from "@/lib/pg-timestamp";

/* ── GET /api/clients/[id]/pot-ledger ──────────────────────────────────
 * Derives the full pot ledger from sessions rows + block_expiry_extensions.
 * No new tables — everything is computed from existing data.
 *
 * Returns:
 *   consumption: { completed, cancelled_free, cancelled_charged, rescheduled, no_show, remaining, purchased }
 *   ledger: [{ date, event, delta, remaining, tags }]
 */

interface LedgerEntry {
  date: string;
  event: string;
  delta: number | null;
  remaining: number | null;
  used?: number;
  tags: string[];
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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch client — include pot_baseline_used for the pre-hub opening balance
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, start_date, created_at, sessions_purchased, block_expiry_date, block_expiry_extensions, pot_baseline_used, pot_baseline_note, pot_baseline_at")
    .eq("client_number", parseInt(params.id))
    .single();
  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch all sessions for this client — sessions link via blocks, not client_id
  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("id")
    .eq("client_id", client.id);
  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }
  const blockIds = (blocks ?? []).map((b: { id: string }) => b.id);

  let sessions: {
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
  }[] = [];
  if (blockIds.length > 0) {
    const { data: sessionRows, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, status, cancelled_at, charged_free, scheduled_at, completed_at, parent_session_id, block_id, session_number, data")
      .in("block_id", blockIds)
      .order("scheduled_at", { ascending: true });
    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }
    sessions = (sessionRows ?? []) as typeof sessions;
  }

  // BUG-EF-142 — derive remaining from actual session data, never the stored column
  const derivedPot = sessions.length > 0
    ? deriveSessionPot(sessions as any, client.sessions_purchased ?? null, (client as any).pot_baseline_used ?? 0)
    : null;

  const purchased = client.sessions_purchased ?? null;
  const extensions = (client.block_expiry_extensions ?? []) as { from: string; to: string; at: string; reason?: string }[];
  const baselineUsed = (client as any).pot_baseline_used ?? 0;

  // BUG-EF-144 — count session categories using deriveSessionStatus.
  // Sub-sessions (parent_session_id) are excluded per CR-EF-101.
  // NULL charged_free is never treated as "charged" (never-guess rule).
  let completed = 0;
  let cancelledFree = 0;
  let cancelledCharged = 0;
  let rescheduled = 0;
  let noShow = 0;

  for (const s of sessions ?? []) {
    if (s.parent_session_id) continue; // CR-EF-101 — sub-sessions excluded
    const sStatus = deriveSessionStatus({ ...s, session_log: (s.data as Record<string, unknown> | null)?.session_log });
    if (sStatus === "completed") {
      completed++;
    } else if (sStatus === "cancelled") {
      if (s.charged_free === "free") {
        cancelledFree++;
      } else if (s.charged_free === "charged") {
        cancelledCharged++;
      }
      // NULL charged_free: neither counted as charged nor free — unreviewed
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

  // ── Build all events without remaining ────────────────────────────
  // Package start date: prefer clients.start_date (the date the client's
  // training account began), then clients.created_at (row insertion time).
  let packageStartDate: string | null =
    (client as any).start_date ?? (client as any).created_at ?? null;

  // BUG-EF-144 — earliest ACTIVITY date (not earliest scheduled), computed
  // from the min of all completed_at / cancelled_at values using
  // deriveSessionStatus to match the pot derivation's own status logic.
  let earliestActivityDate: string | null = null;
  for (const s of sessions ?? []) {
    if (s.parent_session_id) continue;
    const sStatus = deriveSessionStatus({ ...s, session_log: (s.data as Record<string, unknown> | null)?.session_log });
    if (sStatus === "completed" && s.completed_at) {
      if (!earliestActivityDate || s.completed_at < earliestActivityDate) {
        earliestActivityDate = s.completed_at;
      }
    } else if (sStatus === "cancelled" && s.charged_free === "charged" && s.cancelled_at) {
      if (!earliestActivityDate || s.cancelled_at < earliestActivityDate) {
        earliestActivityDate = s.cancelled_at;
      }
    }
  }
  if (
    packageStartDate &&
    earliestActivityDate &&
    new Date(packageStartDate).getTime() > new Date(earliestActivityDate).getTime()
  ) {
    packageStartDate = earliestActivityDate;
  }

  const events: { date: string; event: string; delta: number | null; tags: string[]; rank: number }[] = [];

  if (packageStartDate) {
    events.push({
      date: toIsoTimestamp(packageStartDate) ?? packageStartDate,
      event: purchased != null ? `Package started — ${purchased} sessions` : "Ongoing package — no session cap",
      delta: purchased,
      tags: [],
      rank: 0,
    });
  }

  // Pre-hub baseline — +1ms after package start so it sorts right after it
  if (baselineUsed > 0) {
    const baselineDate = packageStartDate
      ? new Date(new Date(packageStartDate).getTime() + 1).toISOString()
      : ((client as any).pot_baseline_at ?? new Date(0).toISOString());
    events.push({
      date: toIsoTimestamp(baselineDate) ?? baselineDate,
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
  // All dates normalised through toIsoTimestamp at push time.
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
  if (client.block_expiry_date) {
    events.push({
      date: toIsoTimestamp(client.block_expiry_date) ?? client.block_expiry_date,
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
        runningCount -= e.delta; // delta is negative for consumption events
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
  let i = 0;
  while (i < sorted.length) {
    if (
      sorted[i].delta === null &&
      sorted[i].tags.includes("Free") &&
      sorted[i].event.startsWith("Session cancelled")
    ) {
      let count = 1;
      let j = i + 1;
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
        date: sorted[i].date,
        event: count === 1 ? "Session cancelled (free)" : `${count} sessions cancelled`,
        delta: null,
        remaining: sorted[j - 1].remaining,
        used: sorted[j - 1].used,
        tags: ["Free"],
      });
      i = j;
    } else {
      collapsed.push(sorted[i]);
      i++;
    }
  }

  // Reverse for newest-first display
  const ledger = collapsed.reverse();

  const consumption = {
    completed,
    cancelled_free: cancelledFree,
    cancelled_charged: cancelledCharged,
    rescheduled,
    no_show: noShow,
    remaining: derivedPot?.remaining ?? null,
    purchased,
    baseline_used: baselineUsed,
    used: derivedPot?.used ?? 0,
    ongoing: purchased === null,
  };

  return NextResponse.json({ consumption, ledger });
}
