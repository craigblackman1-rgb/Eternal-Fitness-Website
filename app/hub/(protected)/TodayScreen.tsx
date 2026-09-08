import Link from "next/link";

/* ── S5 Today (design-systems v3/03-today.html) ───────────────────────────
   The attention queue. Booked sessions first, then outstanding tasks (as a
   linked tile), then alerts — every alert links to the surface that answers
   it.

   Replaces a dashboard of seven browse-widgets (recent clients, recent
   blocks, this week's plan, recent check-ins…). Those answered "what has
   been happening"; this answers "what needs me". That is the whole point of
   the surface, so their removal is the design, not an omission. */

export interface TodaySession {
  time: string;
  clientName: string;
  clientNumber: number;
  focus: string | null;
}

export interface AlertRow {
  id: string;
  headline: string;
  subline?: string;
  actionLabel: string;
  href: string;
  dot: "due" | "warn";
}

const DOT: Record<string, string> = {
  due: "bg-rose",
  warn: "bg-[var(--status-warning)]",
};

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden mb-3.5">
      <div className="flex items-center gap-2.5 py-2.5 px-4 border-b border-[var(--hub-border)]">
        <h2 className="m-0 text-[15px] font-bold text-[var(--color-ink)] tracking-tight">{title}</h2>
        {meta && <span className="text-xs text-[var(--color-muted)]">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

export function TodayScreen({
  dateLabel,
  sessions,
  weekCount,
  taskCount,
  alerts,
}: {
  dateLabel: string;
  sessions: TodaySession[];
  weekCount: number;
  taskCount: number;
  alerts: AlertRow[];
}) {
  return (
    <div className="w-full max-w-[940px]">
      {/* ── Header ── */}
      <div className="mb-3">
        <h1 className="m-0 text-[25px] font-bold tracking-tight text-[var(--color-ink)]">Today</h1>
        <p className="m-0 mt-0.5 text-[13px] text-[var(--color-body)]">{dateLabel}</p>
      </div>

      {/* ── 1 · Booked today ── */}
      <Section
        title="Booked today"
        meta={
          sessions.length === 0
            ? `Nothing booked · ${weekCount} this week`
            : `${sessions.length} session${sessions.length === 1 ? "" : "s"} · ${weekCount} this week`
        }
      >
        <div>
          {sessions.map((s, i) => (
            <div
              key={`${s.clientNumber}-${i}`}
              className="flex items-center gap-3 py-2 px-4 border-t border-[var(--hub-border)] first:border-t-0 hover:bg-[var(--hub-hover)] transition-colors"
            >
              <span className="w-[52px] shrink-0 text-[13px] font-semibold text-[var(--color-ink)] tabular-nums">
                {s.time}
              </span>
              <span className="flex-1 min-w-0 text-[13.5px] text-[var(--color-ink)]">
                <b className="font-semibold">{s.clientName}</b>
                {s.focus && <span className="text-[var(--color-muted)]"> · {s.focus}</span>}
              </span>
              <Link
                href={`/hub/clients/${s.clientNumber}`}
                className="shrink-0 inline-flex items-center justify-center rounded-control border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] text-xs font-semibold no-underline transition-colors"
              >
                Open
              </Link>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="m-0 py-6 px-4 text-[13px] text-[var(--color-muted)]">Nothing booked today.</p>
          )}
        </div>
      </Section>

      {/* ── 2 · Outstanding tasks ──
           A linked tile, not a list. The full task list lives at /hub/tasks;
           Today shows the count and one click to get there. */}
      <Section
        title="Outstanding tasks"
        meta={taskCount > 0 ? `${taskCount} open` : undefined}
      >
        <div className="px-4 pb-3 pt-1">
          {taskCount > 0 ? (
            <div className="flex items-center gap-3 py-2 px-3 rounded-nested border border-transparent hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)] transition-colors">
              <span className="w-[7px] h-[7px] rounded-pill bg-[var(--status-warning)] shrink-0" />
              <span className="min-w-0 flex-1 text-[13.5px] text-[var(--color-ink)]">
                <b className="font-semibold">{taskCount} open task{taskCount === 1 ? "" : "s"}</b>
                <span className="block text-xs text-[var(--color-muted)] mt-px">In the order you&apos;d work them</span>
              </span>
              <Link
                href="/hub/tasks"
                className="shrink-0 inline-flex items-center justify-center rounded-control border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] text-xs font-semibold no-underline transition-colors"
              >
                See all
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 py-2 px-3 text-[13px] text-[var(--color-muted)]">
              <span className="w-[7px] h-[7px] rounded-pill bg-[var(--status-success)] shrink-0" />
              <span>No outstanding tasks.</span>
            </div>
          )}
        </div>
      </Section>

      {/* ── 3 · Alerts ──
           Every alert links to the surface that answers it. The same
           pattern as the arow on the client record: dot · headline · action.
           No drawers here — direct links to the destination screens. */}
      <Section title="Alerts" meta={alerts.length > 0 ? `${alerts.length} thing${alerts.length === 1 ? "" : "s"} need${alerts.length === 1 ? "s" : ""} a decision` : undefined}>
        <div className="px-4 pb-3 pt-1">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 py-2 px-3 rounded-nested border border-transparent hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)] transition-colors"
            >
              <span className={`w-[7px] h-[7px] rounded-pill shrink-0 ${DOT[a.dot]}`} />
              <span className="min-w-0 flex-1 text-[13.5px] text-[var(--color-ink)]">
                <b className="font-semibold">{a.headline}</b>
                {a.subline && <span className="block text-xs text-[var(--color-muted)] mt-px">{a.subline}</span>}
              </span>
              <Link
                href={a.href}
                className="shrink-0 inline-flex items-center justify-center rounded-control border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] text-xs font-semibold no-underline transition-colors"
              >
                {a.actionLabel}
              </Link>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="flex items-center gap-2.5 py-2 px-3 text-[13px] text-[var(--color-muted)]">
              <span className="w-[7px] h-[7px] rounded-pill bg-[var(--status-success)] shrink-0" />
              <span>Nothing needs looking at.</span>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
