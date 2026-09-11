import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { syncSessionCalendarEvent } from "@/lib/calendar-sync";
import { getAvailabilityOverrides } from "@/lib/availability";
import { londonDayKey } from "@/lib/schedule-dates";

/**
 * CR-EF-199 — Book one or a repeating weekly pattern of sessions against
 * a client's active block from the desktop client record.
 *
 * POST body:
 *   mode: "single" | "pattern"
 *   dry_run: boolean
 *   single?: { date, time, note? }
 *   pattern?: { days, time, times?, start_date, until }
 */

interface SingleBody {
  date: string;
  time: string;
  note?: string;
}

interface PatternBody {
  days: number[];
  time: string;
  times?: Record<number, string>;
  start_date: string;
  until: { kind: "pot" | "expiry" | "count"; count?: number };
}

type RequestBody = {
  mode: "single" | "pattern";
  dry_run: boolean;
  single?: SingleBody;
  pattern?: PatternBody;
};

interface SkippedDate {
  date: string;
  reason: string;
}

interface BookedSession {
  id?: string;
  scheduled_at: string;
}

interface BookResponse {
  block_id: string;
  block_number: number;
  pot_remaining: number | null;
  expiry: string | null;
  sessions: BookedSession[];
  skipped: SkippedDate[];
  total: number;
  over_pot: number;
}

const SESSION_LENGTH_MIN = 60;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Resolve client ─────────────────────────────────────────────────
  const numericId = parseInt(params.id, 10);
  const col = Number.isFinite(numericId) && numericId > 0 && String(numericId) === params.id ? "client_number" : "id";
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, client_number, sessions_remaining, block_expiry_date, delivery_mode")
    .eq(col, params.id)
    .maybeSingle();
  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // ── Active block ───────────────────────────────────────────────────
  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, block_number, status")
    .eq("client_id", client.id)
    .order("block_number", { ascending: false });
  const activeBlock = (blocks ?? []).find((b) => b.status === "active") ?? (blocks ?? [])[0];
  if (!activeBlock) {
    return NextResponse.json({ error: "No active block found for this client" }, { status: 404 });
  }

  // ── Parse body ─────────────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.mode || !["single", "pattern"].includes(body.mode)) {
    return NextResponse.json({ error: "mode must be 'single' or 'pattern'" }, { status: 400 });
  }
  if (body.mode === "single" && !body.single) {
    return NextResponse.json({ error: "single body required for mode=single" }, { status: 400 });
  }
  if (body.mode === "pattern" && !body.pattern) {
    return NextResponse.json({ error: "pattern body required for mode=pattern" }, { status: 400 });
  }

  // ── Availability overrides (shared across both modes) ──────────────
  let overrides: Awaited<ReturnType<typeof getAvailabilityOverrides>> = [];
  try {
    overrides = await getAvailabilityOverrides();
  } catch {
    // Availability table may not exist — treat as no overrides
  }

  // ── Existing sessions in this block (for session_number + clash) ───
  const { data: existingSessions } = await supabase
    .from("sessions")
    .select("id, session_number, scheduled_at, cancelled_at, parent_session_id, data, block_id, client_id")
    .eq("block_id", activeBlock.id);
  const blockSessions = (existingSessions ?? []) as {
    id: string;
    session_number: number;
    scheduled_at: string | null;
    cancelled_at: string | null;
    parent_session_id: string | null;
    block_id: string;
    client_id: string;
  }[];

  // Future scheduled sessions for pot counting
  const now = new Date();
  const futureScheduled = blockSessions.filter(
    (s) => s.scheduled_at && !s.cancelled_at && !s.parent_session_id && new Date(s.scheduled_at) > now
  );

  // Session number: highest slot number (excluding sub-sessions)
  const slotRows = blockSessions.filter((s) => !s.parent_session_id);
  let nextSessionNumber = slotRows.reduce((max, s) => Math.max(max, s.session_number), 0) + 1;

  // ── Clash check: ALL non-cancelled sessions across all clients ─────
  // sessions has no client_id — resolve via block_id → blocks.client_id.
  // Restrict to sessions within 1 day before the requested range to avoid
  // pulling every session ever.
  const clashRangeStart = body.mode === "single" && body.single
    ? new Date(new Date(body.single.date).getTime() - 86_400_000).toISOString()
    : body.mode === "pattern" && body.pattern
      ? new Date(new Date(body.pattern.start_date).getTime() - 86_400_000).toISOString()
      : new Date(Date.now() - 86_400_000).toISOString();

  const { data: allSessions } = await supabase
    .from("sessions")
    .select("id, scheduled_at, cancelled_at, block_id, blocks(client_id)")
    .not("scheduled_at", "is", null)
    .is("cancelled_at", null)
    .is("parent_session_id", null)
    .gte("scheduled_at", clashRangeStart);

  // Resolve client names for clash messages
  const allClientIds = [...new Set((allSessions ?? []).map((s: any) => s.blocks?.client_id).filter(Boolean))];
  const { data: nameRows } = allClientIds.length
    ? await supabase.from("clients").select("id, name").in("id", allClientIds)
    : { data: [] };
  const nameMap = new Map((nameRows ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));

  // Build a set of occupied time windows: "YYYY-MM-DD HH:MM" for clash detection
  const occupiedWindows = new Set<string>();
  for (const s of allSessions ?? []) {
    if (s.scheduled_at && !s.cancelled_at) {
      const d = new Date(s.scheduled_at);
      // The whole 60-min window is occupied
      for (let m = 0; m < SESSION_LENGTH_MIN; m += 15) {
        const t = new Date(d.getTime() + m * 60_000);
        const hh = String(t.getHours()).padStart(2, "0");
        const mm = String(t.getMinutes()).padStart(2, "0");
        const dayKey = londonDayKey(t.toISOString());
        occupiedWindows.add(`${dayKey} ${hh}:${mm}`);
      }
    }
  }

  function checkClash(dateStr: string, timeStr: string): SkippedDate | null {
    const [h, m] = timeStr.split(":").map(Number);
    const startMs = new Date(dateStr + "T" + timeStr + ":00").getTime();

    // Check each 15-min slot in the window
    for (let offset = 0; offset < SESSION_LENGTH_MIN; offset += 15) {
      const t = new Date(startMs + offset * 60_000);
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      const dayKey = londonDayKey(t.toISOString());
      const key = `${dayKey} ${hh}:${mm}`;

      if (occupiedWindows.has(key)) {
        // Find which client/session occupies it
        const conflict = (allSessions ?? []).find((s: any) => {
          if (!s.scheduled_at || s.cancelled_at) return false;
          const sd = new Date(s.scheduled_at);
          const ed = new Date(sd.getTime() + SESSION_LENGTH_MIN * 60_000);
          return t >= sd && t < ed;
        });
        if (conflict) {
          const cid = conflict.blocks?.client_id ?? "unknown";
          const clientName = nameMap.get(cid) ?? "another client";
          return { date: dateStr, reason: `clashes with ${clientName}` };
        }
      }
    }

    // Check Esther's availability overrides (off days)
    const off = overrides.find(
      (o) => o.override_type === "time_off" && o.active && dateStr >= o.start_date && dateStr <= o.end_date && !o.start_time && !o.end_time
    );
    if (off) {
      return { date: dateStr, reason: off.reason ?? "off day" };
    }

    // Partial time off check
    const partialOff = overrides.find((o) => {
      if (o.override_type !== "time_off" || !o.active) return false;
      if (dateStr < o.start_date || dateStr > o.end_date) return false;
      if (!o.start_time || !o.end_time) return false;
      return timeStr >= o.start_time && timeStr < o.end_time;
    });
    if (partialOff) {
      return { date: dateStr, reason: partialOff.reason ?? "off day" };
    }

    return null;
  }

  // ── SINGLE MODE ────────────────────────────────────────────────────
  if (body.mode === "single" && body.single) {
    const { date, time, note } = body.single;
    if (!date || !time) {
      return NextResponse.json({ error: "date and time required" }, { status: 400 });
    }

    const clash = checkClash(date, time);
    if (clash && !body.dry_run) {
      return NextResponse.json({ error: clash.reason, skipped: [clash] }, { status: 409 });
    }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    if (body.dry_run) {
      return NextResponse.json({
        block_id: activeBlock.id,
        block_number: activeBlock.block_number,
        pot_remaining: client.sessions_remaining,
        expiry: client.block_expiry_date,
        sessions: clash ? [] : [{ scheduled_at: scheduledAt }],
        skipped: clash ? [clash] : [],
        total: clash ? 0 : 1,
        over_pot: 0, // single mode: 1 session can never exceed pot
      } satisfies BookResponse);
    }

    // Insert the session
    const sessionData = {
      session_id: crypto.randomUUID(),
      block_id: activeBlock.id,
      client_id: client.id,
      session_number: nextSessionNumber,
      archetype: null,
      week: 1,
      phase: null,
      focus_label: note?.trim() || null,
      time_tier: "standard",
      versions: {
        studio: { warm_up: [], main_block: [], cooldown: [] },
        home: { warm_up: [], main_block: [], cooldown: [] },
      },
      coaching_notes: note?.trim() ? `Booked: ${note.trim()}` : "Booked session (no content yet).",
      client_intro: "",
    };

    const { data: created, error: insertErr } = await supabase
      .from("sessions")
      .insert({
        block_id: activeBlock.id,
        session_number: nextSessionNumber,
        archetype: null,
        week: 1,
        phase: null,
        data: sessionData,
        scheduled_at: scheduledAt,
        status: "scheduled",
      })
      .select()
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // Sync to calendar (swallow per-session failure)
    try {
      await syncSessionCalendarEvent(created.id);
    } catch (err) {
      console.error(`[CR-EF-199] calendar sync failed for session ${created.id}:`, err);
    }

    return NextResponse.json({
      block_id: activeBlock.id,
      block_number: activeBlock.block_number,
      pot_remaining: client.sessions_remaining,
      expiry: client.block_expiry_date,
      sessions: [{ id: created.id, scheduled_at: scheduledAt }],
      skipped: [],
      total: 1,
      over_pot: 0,
    } satisfies BookResponse, { status: 201 });
  }

  // ── PATTERN MODE ───────────────────────────────────────────────────
  const pat = body.pattern!;
  if (!pat.days?.length || !pat.time || !pat.start_date || !pat.until) {
    return NextResponse.json({ error: "days, time, start_date, and until required" }, { status: 400 });
  }

  const cap = pat.until.kind === "pot"
    ? (client.sessions_remaining ?? 0) - futureScheduled.length
    : pat.until.kind === "count"
      ? Math.min(pat.until.count ?? 1, 200)
      : 200; // expiry: hard ceiling 200

  const effectiveCap = Math.max(0, Math.min(cap, 200));

  // Generate candidate dates
  const candidates: { date: string; time: string }[] = [];
  const skipped: SkippedDate[] = [];
  const booked: BookedSession[] = [];

  let cursorDate = pat.start_date;
  const maxScanDays = (effectiveCap + 1) * 7 + 14; // safety
  let daysScanned = 0;

  while (candidates.length + booked.length < effectiveCap && daysScanned <= maxScanDays) {
    const d = new Date(cursorDate);
    const dow = d.getDay(); // 0=Sun

    if (pat.days.includes(dow)) {
      // Per-day time override, or use the shared time
      const timeStr = pat.times?.[dow] ?? pat.time;

      // Expiry check: if until.kind === "expiry", stop past block_expiry_date
      if (pat.until.kind === "expiry" && client.block_expiry_date && cursorDate > client.block_expiry_date) {
        break;
      }

      const clash = checkClash(cursorDate, timeStr);
      if (clash) {
        skipped.push(clash);
      } else {
        candidates.push({ date: cursorDate, time: timeStr });
      }
    }

    // Advance cursor
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    cursorDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    daysScanned++;
  }

  // ── Dry run ────────────────────────────────────────────────────────
  if (body.dry_run) {
    const available = client.sessions_remaining != null
      ? client.sessions_remaining - futureScheduled.length
      : Infinity;
    const overPot = available === Infinity ? 0 : Math.max(0, candidates.length - available);

    return NextResponse.json({
      block_id: activeBlock.id,
      block_number: activeBlock.block_number,
      pot_remaining: client.sessions_remaining,
      expiry: client.block_expiry_date,
      sessions: candidates.map((c) => ({
        scheduled_at: new Date(`${c.date}T${c.time}:00`).toISOString(),
      })),
      skipped,
      total: candidates.length,
      over_pot: overPot,
    } satisfies BookResponse);
  }

  // ── Insert all sessions in sequence ────────────────────────────────
  let sessionNum = nextSessionNumber;
  const createdIds: string[] = [];

  for (const c of candidates) {
    const scheduledAt = new Date(`${c.date}T${c.time}:00`).toISOString();
    const sessionData = {
      session_id: crypto.randomUUID(),
      block_id: activeBlock.id,
      client_id: client.id,
      session_number: sessionNum,
      archetype: null,
      week: 1,
      phase: null,
      focus_label: null,
      time_tier: "standard",
      versions: {
        studio: { warm_up: [], main_block: [], cooldown: [] },
        home: { warm_up: [], main_block: [], cooldown: [] },
      },
      coaching_notes: "Booked session (no content yet).",
      client_intro: "",
    };

    const { data: created, error: insertErr } = await supabase
      .from("sessions")
      .insert({
        block_id: activeBlock.id,
        session_number: sessionNum,
        archetype: null,
        week: 1,
        phase: null,
        data: sessionData,
        scheduled_at: scheduledAt,
        status: "scheduled",
      })
      .select()
      .single();

    if (insertErr) {
      console.error(`[CR-EF-199] insert failed for session ${sessionNum}:`, insertErr);
      continue; // skip failed inserts, keep going
    }

    createdIds.push(created.id);
    booked.push({ id: created.id, scheduled_at: scheduledAt });
    sessionNum++;
  }

  // Sync each to calendar, swallowing per-session failures
  for (const id of createdIds) {
    try {
      await syncSessionCalendarEvent(id);
    } catch (err) {
      console.error(`[CR-EF-199] calendar sync failed for session ${id}:`, err);
    }
  }

  const available = client.sessions_remaining != null
    ? client.sessions_remaining - futureScheduled.length
    : Infinity;
  const overPot = available === Infinity ? 0 : Math.max(0, booked.length - available);

  return NextResponse.json({
    block_id: activeBlock.id,
    block_number: activeBlock.block_number,
    pot_remaining: client.sessions_remaining,
    expiry: client.block_expiry_date,
    sessions: booked,
    skipped,
    total: booked.length,
    over_pot: overPot,
  } satisfies BookResponse, { status: 201 });
}
