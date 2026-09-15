import { getPool } from "@/lib/pg-client";
import { getTodayAlertsAndWeekCount } from "@/lib/hub/alerts";
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

export default async function HubTodayPage() {
  const pool = getPool();
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  const [todayRows, taskRows, { alerts, weekCount }] = await Promise.all([
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
        `SELECT t.id, t.title, t.due_date, c.name, c.client_number
           FROM tasks t LEFT JOIN clients c ON c.id = t.client_id
          WHERE t.status IS DISTINCT FROM 'done'
          ORDER BY (t.due_date IS NULL), t.due_date, t.created_at`,
      )
      .then((r) => r.rows),
    getTodayAlertsAndWeekCount(now),
  ]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const sessions: TodaySession[] = (todayRows as any[]).map((r) => ({
    time: fmtTime(r.scheduled_at),
    clientName: r.name,
    clientNumber: r.client_number,
    focus: sessionWorkoutName({ archetype: r.archetype, week: r.week, phase: r.phase, data: r.data }, "Session"),
  }));

  return (
    <TodayScreen
      dateLabel={now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
      sessions={sessions}
      weekCount={weekCount}
      taskCount={(taskRows as any[]).length}
      alerts={alerts as AlertRow[]}
    />
  );
}
