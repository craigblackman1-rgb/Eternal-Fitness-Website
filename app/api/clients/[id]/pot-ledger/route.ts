import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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
  remaining: number;
  tags: string[];
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
    .select("id, start_date, created_at, sessions_purchased, sessions_remaining, block_expiry_date, block_expiry_extensions, pot_baseline_used, pot_baseline_note, pot_baseline_at")
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
    block_id: string;
    session_number: number | null;
  }[] = [];
  if (blockIds.length > 0) {
    const { data: sessionRows, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, status, cancelled_at, charged_free, scheduled_at, completed_at, block_id, session_number")
      .in("block_id", blockIds)
      .order("scheduled_at", { ascending: true });
    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }
    sessions = (sessionRows ?? []) as typeof sessions;
  }

  const purchased = client.sessions_purchased ?? 0;
  const remaining = client.sessions_remaining ?? 0;
  const extensions = (client.block_expiry_extensions ?? []) as { from: string; to: string; at: string; reason?: string }[];
  const baselineUsed = (client as any).pot_baseline_used ?? 0;

  // Count session categories
  let completed = 0;
  let cancelledFree = 0;
  let cancelledCharged = 0;
  let rescheduled = 0;
  let noShow = 0;

  for (const s of sessions ?? []) {
    if (s.status === "completed") {
      completed++;
    } else if (s.status === "cancelled") {
      if (s.charged_free === "free") {
        cancelledFree++;
      } else {
        cancelledCharged++;
      }
      // Check if it was rescheduled (has a parent or was moved)
      if (s.scheduled_at && s.cancelled_at && new Date(s.scheduled_at) > new Date(s.cancelled_at)) {
        rescheduled++;
      }
    } else if (s.status === "scheduled" && s.scheduled_at) {
      // Check for no-show: scheduled, past, not completed, not cancelled
      const scheduledDate = new Date(s.scheduled_at);
      if (scheduledDate < new Date() && !s.completed_at) {
        noShow++;
      }
    }
  }

  // ── Build all events without remaining ────────────────────────────
  // Package start date: prefer clients.start_date (the date the client's
  // training account began), then clients.created_at (row insertion time),
  // then earliest session scheduled_at.
  const firstSession = (sessions ?? [])[0];
  let packageStartDate: string | null =
    (client as any).start_date ?? (client as any).created_at ?? firstSession?.scheduled_at ?? null;

  // If packageStartDate is in the future relative to the earliest real
  // activity (completed session, charged cancel), pull it back.
  const earliestActivity = [...(sessions ?? [])].find(
    (s) =>
      (s.status === "completed" && s.completed_at) ||
      (s.status === "cancelled" && s.charged_free !== "free" && s.cancelled_at),
  );
  const earliestActivityDate =
    earliestActivity?.completed_at ?? earliestActivity?.cancelled_at ?? null;
  if (
    packageStartDate &&
    earliestActivityDate &&
    new Date(packageStartDate).getTime() > new Date(earliestActivityDate).getTime()
  ) {
    packageStartDate = earliestActivityDate;
  }

  const events: { date: string; event: string; delta: number | null; tags: string[] }[] = [];

  if (packageStartDate) {
    events.push({
      date: packageStartDate,
      event: `Package started — ${purchased} sessions`,
      delta: purchased,
      tags: [],
    });
  }

  // Pre-hub baseline — +1ms after package start so it sorts right after it
  if (baselineUsed > 0) {
    const baselineDate = packageStartDate
      ? new Date(new Date(packageStartDate).getTime() + 1).toISOString()
      : ((client as any).pot_baseline_at ?? new Date(0).toISOString());
    events.push({
      date: baselineDate,
      event: `Before the hub — ${baselineUsed} sessions used (Trainerize)`,
      delta: -baselineUsed,
      tags: [],
    });
  }

  // Extension events
  for (const ext of extensions) {
    events.push({
      date: ext.at,
      event: `Expiry extended ${ext.from} → ${ext.to}${ext.reason ? ` (${ext.reason})` : ""}`,
      delta: null,
      tags: [],
    });
  }

  // Session events — every session belongs to this client's blocks and
  // therefore necessarily belongs to this package.  The old predate filter
  // (scheduled_at < packageStartDate) caused a bootstrapping bug: the
  // pull-back derives packageStartDate from activity dates (completed_at /
  // cancelled_at), which are stamped later than scheduled_at, then drops
  // the very sessions that anchor the corrected date — under-counting vs
  // the summary counters.  Since all fetched sessions belong to this
  // client, no filter is needed.
  for (const s of sessions ?? []) {
    if (s.status === "completed" && s.completed_at) {
      events.push({
        date: s.completed_at,
        event: "Session completed",
        delta: -1,
        tags: [],
      });
    } else if (s.status === "cancelled" && s.cancelled_at) {
      const isFree = s.charged_free === "free";
      events.push({
        date: s.cancelled_at,
        event: isFree ? "Session cancelled (free)" : "Session cancelled (charged)",
        delta: isFree ? null : -1,
        tags: isFree ? ["Free"] : [],
      });
    }
  }

  // Package expiry event
  if (client.block_expiry_date) {
    events.push({
      date: client.block_expiry_date,
      event: "Package expired",
      delta: null,
      tags: [],
    });
  }

  // ── Sort ascending, walk computing remaining ──────────────────────
  // Tie-break: package-started before baseline at the same instant so
  // ascending reads naturally (purchase → baseline → activity).
  events.sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (diff !== 0) return diff;
    if (a.event.startsWith("Package started")) return -1;
    if (b.event.startsWith("Package started")) return 1;
    return 0;
  });

  let runningRemaining = 0;
  const sorted: LedgerEntry[] = events.map((e) => {
    runningRemaining =
      e.delta !== null ? Math.max(0, runningRemaining + e.delta) : runningRemaining;
    return { date: e.date, event: e.event, delta: e.delta, remaining: runningRemaining, tags: e.tags };
  });

  // ── Collapse consecutive free-cancel no-ops ───────────────────────
  const collapsed: LedgerEntry[] = [];
  let i = 0;
  while (i < sorted.length) {
    if (
      sorted[i].delta === null &&
      sorted[i].tags.includes("Free") &&
      sorted[i].event.startsWith("Session cancelled")
    ) {
      let count = 1;
      let lastDate = sorted[i].date;
      let j = i + 1;
      while (
        j < sorted.length &&
        sorted[j].delta === null &&
        sorted[j].tags.includes("Free") &&
        sorted[j].event.startsWith("Session cancelled")
      ) {
        count++;
        lastDate = sorted[j].date;
        j++;
      }
      collapsed.push({
        date: lastDate,
        event: count === 1 ? "Session cancelled (free)" : `${count} sessions cancelled`,
        delta: null,
        remaining: sorted[i].remaining,
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
    remaining,
    purchased,
    baseline_used: baselineUsed,
  };

  return NextResponse.json({ consumption, ledger });
}
