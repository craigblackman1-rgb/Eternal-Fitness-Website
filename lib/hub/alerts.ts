import { getPool } from "@/lib/pg-client";
import { getClientsNeedingAttention } from "@/lib/hub/attention";
import { getClientsUpdateDueSoon } from "@/lib/updates-due-db";

export interface AlertItem {
  id: string;
  dot: "due" | "warn";
  headline: string;
  subline?: string;
  actionLabel: string;
  href: string;
}

const QUIET_DAYS = 7;

function startOfWeek(d: Date): string {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}

const names = (xs: any[], max = 3) => {
  const first = xs.slice(0, max).map((x) => x.name);
  if (xs.length <= max) return first.join(", ").replace(/, ([^,]*)$/, " and $1");
  return `${first.join(", ")} and ${xs.length - max} more`;
};

/**
 * Derive the alerts list and week session count for the Today screen.
 * Shared between the desktop hub page and the PWA Today page so both
 * surfaces always show the same numbers.
 */
export async function getTodayAlertsAndWeekCount(now: Date = new Date()): Promise<{
  alerts: AlertItem[];
  weekCount: number;
}> {
  const pool = getPool();
  const todayIso = now.toISOString().slice(0, 10);
  const weekStart = startOfWeek(now);

  const [
    weekRow,
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
        `SELECT count(*)::int AS n FROM sessions s
          WHERE s.scheduled_at >= $1::date AND s.scheduled_at < $1::date + INTERVAL '7 days'
            AND s.cancelled_at IS NULL AND s.parent_session_id IS NULL`,
        [weekStart],
      )
      .then((r) => r.rows[0]?.n ?? 0),
    getClientsNeedingAttention(),
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
    getClientsUpdateDueSoon(7),
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
    pool
      .query(
        `SELECT count(*)::int AS n FROM outlook_booking_events WHERE status = 'open'`,
      )
      .then((r) => r.rows[0]?.n ?? 0),
    pool
      .query(
        `SELECT count(*)::int AS n FROM sessions
          WHERE lapse_flagged_at IS NOT NULL
            AND status = 'scheduled'
            AND parent_session_id IS NULL`,
      )
      .then((r) => r.rows[0]?.n ?? 0),
  ]);

  const alerts: AlertItem[] = [];

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
      headline: `${draftRows.length} training plan${draftRows.length === 1 ? "" : "s"} ${draftRows.length === 1 ? "is" : "are"} still draft`,
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
      headline: `${unconfirmedBookingsRow} unconfirmed booking${unconfirmedBookingsRow === 1 ? "" : "s"} waiting to be sorted`,
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

  return { alerts, weekCount: weekRow as number };
}
