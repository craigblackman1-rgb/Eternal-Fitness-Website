import { getPool } from "@/lib/pg-client";
import { getClientsNeedingAttention } from "@/lib/hub/attention";
import { getClientsUpdateDueSoon } from "@/lib/updates-due-db";
import { sessionWorkoutName } from "@/lib/session-display";
import { TodayScreen, type TodaySession, type AlertRow } from "./TodayScreen";

/* ── S5 Today (design-systems v3/03-today.html) ───────────────────────────
   The attention queue: booked sessions, then outstanding tasks, then alerts.
   Every alert links to the surface that answers it.

   Replaces the previous dashboard's seven browse widgets (recent clients,
   recent blocks, this week's plan, recent check-ins…). Those answered
   "what has been happening"; this surface answers "what needs me", so
   dropping them is the design rather than an omission. */

/* This page reads the database on every request and must never be
   statically prerendered: the Docker build has no database, so Next trying to
   generate it at build time fails the build outright. The other hub pages get
   this implicitly by calling createClient() (which reads cookies); this one
   only uses the pool, so it has to say so. */
export const dynamic = "force-dynamic";

const QUIET_DAYS = 7;

function startOfWeek(d: Date): string {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}

export default async function HubTodayPage() {
  const pool = getPool();
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const weekStart = startOfWeek(now);

  const [
    todayRows,
    weekRow,
    taskRows,
    clearanceRows,
    quietRows,
    draftRows,
    updateRows,
    unsignedDocsRows,
    unconfirmedBookingsRow,
    flaggedSessionsRow,
  ] = await Promise.all([
    pool
      .query(
        `SELECT s.scheduled_at, c.name, c.client_number,
                s.archetype, s.week, s.phase, s.data
           FROM sessions s
           JOIN blocks b ON b.id = s.block_id
           JOIN clients c ON c.id = b.client_id
          WHERE s.scheduled_at::date = $1::date
            AND s.cancelled_at IS NULL
            AND s.parent_session_id IS NULL
          ORDER BY s.scheduled_at`,
        [todayIso],
      )
      .then((r) => r.rows),
    pool
      .query(
        `SELECT count(*)::int AS n FROM sessions s
          WHERE s.scheduled_at >= $1::date AND s.scheduled_at < $1::date + INTERVAL '7 days'
            AND s.cancelled_at IS NULL AND s.parent_session_id IS NULL`,
        [weekStart],
      )
      .then((r) => r.rows[0]?.n ?? 0),
    pool
      .query(
        `SELECT t.id, t.title, t.due_date, c.name, c.client_number
           FROM tasks t LEFT JOIN clients c ON c.id = t.client_id
          WHERE t.status IS DISTINCT FROM 'done'
          ORDER BY (t.due_date IS NULL), t.due_date, t.created_at`,
      )
      .then((r) => r.rows),
    // Clearance / action outstanding — the SAME derivation the clients list
    // uses, so the two screens cannot quote different numbers.
    getClientsNeedingAttention(),
    // Gone quiet — silence from either side of the logging divide, and only
    // for people who are supposed to be training (a live block).
    pool
      .query(
        `SELECT c.client_number, c.name
           FROM clients c
           JOIN blocks b ON b.client_id = c.id
           LEFT JOIN sessions s ON s.block_id = b.id
           LEFT JOIN set_logs sl ON sl.session_id = s.id
          WHERE c.client_status IS DISTINCT FROM 'archived'
          GROUP BY c.id, c.client_number, c.name
         HAVING bool_or(b.status IN ('approved','active'))
            AND GREATEST(
                  COALESCE(MAX(sl.logged_at), 'epoch'::timestamptz),
                  COALESCE(MAX(s.completed_at), 'epoch'::timestamptz)
                ) < now() - ($1 || ' days')::interval
          ORDER BY c.name`,
        [String(QUIET_DAYS)],
      )
      .then((r) => r.rows),
    pool
      .query(
        `SELECT c.client_number, c.name, b.block_number
           FROM blocks b JOIN clients c ON c.id = b.client_id
          WHERE b.status = 'draft' AND c.client_status IS DISTINCT FROM 'archived'
          ORDER BY c.name`,
      )
      .then((r) => r.rows),
    // Updates due — kept from the old dashboard on purpose (see header note).
    // Uses the real cadence derivation: only 1 client in 22 has a fixed
    // next-date, so keying off that column alone would leave this
    // permanently empty while looking present.
    getClientsUpdateDueSoon(7),
    // Unsigned documents — documents requiring client signature that haven't
    // been signed yet. Counted per-client so the number matches the compliance
    // screen's own derivation.
    pool
      .query(
        `SELECT c.client_number, c.name, count(*)::int AS doc_count
           FROM client_documents cd
           JOIN clients c ON c.id = cd.client_id
          WHERE cd.requires_client_signature = true
            AND cd.client_signed_date IS NULL
            AND cd.status IS DISTINCT FROM 'draft'
            AND c.client_status IS DISTINCT FROM 'archived'
          GROUP BY c.id, c.client_number, c.name
          ORDER BY count(*) DESC`,
      )
      .then((r) => r.rows),
    // Unconfirmed Outlook bookings — the same count the triage screen shows,
    // so Today cannot quote a different number.
    pool
      .query(
        `SELECT count(*)::int AS n FROM outlook_booking_events WHERE status = 'open'`,
      )
      .then((r) => r.rows[0]?.n ?? 0),
    // Flagged sessions — sessions with lapse_flagged_at set, same derivation
    // as the triage screen's "Sessions flagged as lapsed" queue.
    pool
      .query(
        `SELECT count(*)::int AS n FROM sessions
          WHERE lapse_flagged_at IS NOT NULL
            AND status = 'scheduled'
            AND parent_session_id IS NULL`,
      )
      .then((r) => r.rows[0]?.n ?? 0),
  ]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (d: any) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const sessions: TodaySession[] = (todayRows as any[]).map((r) => ({
    time: fmtTime(r.scheduled_at),
    clientName: r.name,
    clientNumber: r.client_number,
    focus: sessionWorkoutName({ archetype: r.archetype, week: r.week, phase: r.phase, data: r.data }, "Session"),
  }));

  const names = (xs: any[], max = 3) => {
    const first = xs.slice(0, max).map((x) => x.name);
    if (xs.length <= max) return first.join(", ").replace(/, ([^,]*)$/, " and $1");
    return `${first.join(", ")} and ${xs.length - max} more`;
  };

  /* ── Alerts — every row links to the surface that answers it.
       Mockup shape: dot · headline · optional subline · one action.
       Order matches the mockup's working order: clearance first (most
       urgent), then quiet, drafts, updates, flagged sessions. */
  const alerts: AlertRow[] = [];

  if (clearanceRows.length)
    alerts.push({
      id: "clearance",
      dot: "warn",
      headline: `${clearanceRows.length} client${clearanceRows.length === 1 ? "" : "s"} need${clearanceRows.length === 1 ? "s" : ""} clearance or account action`,
      actionLabel: "Review",
      href: "/hub/clients",
    });

  if (quietRows.length)
    alerts.push({
      id: "quiet",
      dot: "due",
      headline: `${quietRows.length} home-training client${quietRows.length === 1 ? "" : "s"} have gone quiet`,
      subline: `Nothing logged in ${QUIET_DAYS} days.`,
      actionLabel: "Review",
      href: "/hub/clients",
    });

  if (draftRows.length)
    alerts.push({
      id: "drafts",
      dot: "warn",
      headline: `${draftRows.length} block${draftRows.length === 1 ? "" : "s"} ${draftRows.length === 1 ? "is" : "are"} still draft`,
      subline: `None can run until you approve ${draftRows.length === 1 ? "it" : "them"}.`,
      actionLabel: "Review",
      href: "/hub/clients?filter=draft-block",
    });

  if (updateRows.length)
    alerts.push({
      id: "updates",
      dot: "due",
      headline: `${updateRows.length} training update${updateRows.length === 1 ? "" : "s"} due`,
      actionLabel: "Review updates",
      href: "/hub/reports/updates",
    });

  if (unconfirmedBookingsRow > 0)
    alerts.push({
      id: "bookings",
      dot: "warn",
      headline: `${unconfirmedBookingsRow} Outlook booking${unconfirmedBookingsRow === 1 ? "" : "s"} waiting to be sorted`,
      actionLabel: "Sort in triage",
      href: "/hub/schedule/triage",
    });

  if (flaggedSessionsRow > 0)
    alerts.push({
      id: "flagged",
      dot: "warn",
      headline: `${flaggedSessionsRow} flagged session${flaggedSessionsRow === 1 ? "" : "s"} need${flaggedSessionsRow === 1 ? "s" : ""} a look`,
      actionLabel: "Review",
      href: "/hub/schedule/triage",
    });

  if (unsignedDocsRows.length) {
    const totalDocs = (unsignedDocsRows as any[]).reduce(
      (sum: number, r: any) => sum + r.doc_count,
      0,
    );
    alerts.push({
      id: "unsigned-docs",
      dot: "warn",
      headline: `${totalDocs} unsigned document${totalDocs === 1 ? "" : "s"}`,
      subline: `${names(unsignedDocsRows)} ${unsignedDocsRows.length === 1 ? "has" : "have"} documents waiting to be signed.`,
      actionLabel: "Review",
      href: "/hub/compliance",
    });
  }

  return (
    <TodayScreen
      dateLabel={now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
      sessions={sessions}
      weekCount={weekRow as number}
      taskCount={(taskRows as any[]).length}
      alerts={alerts}
    />
  );
}
