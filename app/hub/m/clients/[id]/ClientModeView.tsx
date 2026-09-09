"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionStatus } from "@/types";
import type { AggregatedExerciseNote } from "@/lib/exercise-notes";
import type { SessionNoteData, PinnedNoteRef } from "@/types";
import type { ClientFlag } from "@/lib/mobile-client-flags";
import type { ExerciseTrendSummary } from "@/lib/progress";
import { DayAgenda, type AgendaSession } from "@/components/hub/DayAgenda";
import { ClientNotesPane } from "./ClientNotesPane";
import { ClientTabBar } from "./ClientTabBar";
import { todayLocalISODate, shiftDay } from "@/lib/schedule-dates";

/* ── Exported view types (derived in page.tsx server component) ── */

export interface RecentSessionView {
  id: string;
  day: number | null;
  month: string;
  name: string;
  sub: string;
}

export interface CalendarSessionView {
  id: string;
  day: number;
  month: string;
  time: string;
  scheduledAt: string;
  name: string;
  status: SessionStatus;
}

export interface SessionView {
  id: string;
  name: string;
  position: number | null;
  total: number | null;
  status: SessionStatus;
  scheduledAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  isToday: boolean;
  dayOfWeek: string | null;
  dayOfMonth: number | null;
  monthShort: string | null;
  time: string | null;
  chargedFree: "charged" | "free" | null;
  cancelReason: string | null;
  subSessionCount: number;
}

export interface PoolWorkoutView {
  id: string;
  letter: string;
  name: string;
  status: "used" | "assigned" | "unused" | "next";
  deliveryDate: string | null;
  assignedDate: string | null;
}

export interface SessionPotView {
  remaining: number | null;
  used: number;
  purchased: number | null;
  purchasedIsEstimate: boolean;
  estimatedPurchase: number;
  estimatedRemaining: number;
  completed: number;
  chargedCancellations: number;
  freeCancellations: number;
  unreviewedCancellations: number;
  bookedAhead: number;
}

export interface PinnedNoteView {
  id: string;
  text: string;
  createdAt: string;
  author: string | null;
}

export interface BlockView {
  id: string;
  number: number;
  focus: string | null;
  done: number;
  total: number;
  pct: number;
}

export interface ProgrammeQueueView {
  programName: string;
  currentWeek: number;
  totalWeeks: number;
  nextSlotLabel: string | null;
  slotLetters: string[];
  nextSessionIndex: number | null;
  totalSessions: number;
}

/* ── Icons ── */

const ICO = {
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  med: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3v18M3 12h18" />
    </svg>
  ),
  warn: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  ok: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  okLg: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  block: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  pin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.8V4h6v6.8l2.4 3.2a1 1 0 0 1-.8 1.6H7.4a1 1 0 0 1-.8-1.6z" />
    </svg>
  ),
  hist: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  chev: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  sessions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  check: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  ),
  xCircle: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  ),
  calSm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  arrowRight: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

function flagIcon(tone: ClientFlag["tone"]) {
  if (tone === "ok") return ICO.ok;
  if (tone === "danger") return ICO.med;
  return ICO.warn;
}

/* ── Component ── */

type TabKey = "training" | "calendar" | "documents" | "comms" | "notes";

interface ClientModeViewProps {
  clientId: string;
  clientNumber: number;
  clientName: string;
  firstName: string;
  initialTab?: TabKey;
  flags: ClientFlag[];
  activeFlagCount: number;
  block: BlockView | null;
  recent: RecentSessionView[];
  calendarSessions: CalendarSessionView[];
  sessionsView: SessionView[];
  poolWorkouts: PoolWorkoutView[];
  potView: SessionPotView;
  unusedPoolCount: number;
  trainTargetId: string | null;
  exerciseNotes?: AggregatedExerciseNote[];
  sessionNotes?: SessionNoteData[];
  pinnedNoteRefs?: PinnedNoteRef[];
  pinnedNote?: PinnedNoteView | null;
  earliestUnattached?: { scheduledAt: string } | null;
  exerciseTrendSummary?: ExerciseTrendSummary;
  programmeQueue?: ProgrammeQueueView | null;
}

export function ClientModeView({
  clientId,
  clientNumber,
  clientName,
  firstName,
  initialTab = "training",
  flags,
  activeFlagCount,
  block,
  recent,
  calendarSessions,
  sessionsView,
  poolWorkouts,
  potView,
  unusedPoolCount,
  trainTargetId,
  exerciseNotes = [],
  sessionNotes = [],
  pinnedNoteRefs = [],
  pinnedNote = null,
  earliestUnattached = null,
  exerciseTrendSummary,
  programmeQueue = null,
}: ClientModeViewProps) {
  const pathname = usePathname();

  // Route-based tabs: documents and comms are separate pages
  const isDocuments = pathname.endsWith("/documents");
  const isComms = pathname.endsWith("/comms");
  const activeTab: TabKey = isDocuments ? "documents" : isComms ? "comms" : initialTab;

  /* ── Accordion state for Medical & compliance (CR-EF-164) ── */
  const accStorageKey = `ef-medcomp-acc:${clientId}`;
  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(accStorageKey) || "{}");
      if (saved && typeof saved === "object") setAccOpen(saved);
    } catch { /* ignore */ }
  }, [accStorageKey]);

  const toggleAcc = useCallback((key: string) => {
    setAccOpen((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(accStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [accStorageKey]);

  const toggleAllAcc = useCallback(() => {
    setAccOpen((prev) => {
      const anyClosed = GROUP_ORDER.some((g) => !prev[g.key]);
      const next: Record<string, boolean> = {};
      for (const g of GROUP_ORDER) next[g.key] = anyClosed;
      try { localStorage.setItem(accStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [accStorageKey]);

  /* ── Group flags by accordion section ── */
  const contraindications = flags.filter((f) => f.group === "contraindications");

  type AccGroup = { key: string; title: string; family: "clinical" | "compliance"; groups: import("@/lib/mobile-client-flags").FlagGroup[] };
  const GROUP_ORDER: AccGroup[] = [
    { key: "conditions", title: "Conditions", family: "clinical", groups: ["conditions"] },
    { key: "medications", title: "Medications", family: "clinical", groups: ["medications"] },
    { key: "pain", title: "Pain points & watch-for", family: "clinical", groups: ["pain", "watch_for"] },
    { key: "mods", title: "Exercise modifications", family: "clinical", groups: ["exercise_modifications"] },
    { key: "compliance", title: "Paperwork & clearance", family: "compliance", groups: ["compliance"] },
  ];

  const groupItems = useMemo(() => {
    const map = new Map<string, ClientFlag[]>();
    for (const g of GROUP_ORDER) {
      // BUG-EF-136: exclude placeholder flags from group contents
      const items = flags.filter((f) => g.groups.includes(f.group) && !f.placeholder);
      map.set(g.key, items);
    }
    return map;
  }, [flags]);

  const visibleGroups = useMemo(
    () => GROUP_ORDER.filter((g) => (groupItems.get(g.key)?.length ?? 0) > 0),
    [groupItems],
  );

  const clinicalGroups = visibleGroups.filter((g) => g.family === "clinical");
  const complianceGroups = visibleGroups.filter((g) => g.family === "compliance");

  const worstTone = (items: ClientFlag[]): "danger" | "warning" | "ok" | "none" => {
    if (items.length === 0) return "none";
    if (items.some((f) => f.tone === "danger")) return "danger";
    if (items.some((f) => f.tone === "warning")) return "warning";
    return "ok";
  };

  const groupCount = visibleGroups.length;
  const totalGroupItems = visibleGroups.reduce((sum, g) => sum + (groupItems.get(g.key)?.length ?? 0), 0);
  const contraCount = contraindications.length;
  const panelSubtitle = `${contraCount} contraindication${contraCount !== 1 ? "s" : ""} · ${totalGroupItems} item${totalGroupItems !== 1 ? "s" : ""} across ${groupCount} group${groupCount !== 1 ? "s" : ""}`;

  const allOpen = GROUP_ORDER.every((g) => accOpen[g.key]);
  const allClosed = GROUP_ORDER.every((g) => !accOpen[g.key]);

  /* ── Pool view ── */
  const nextPool = poolWorkouts.find((w) => w.status === "next");

  return (
    <>
      <main className="mcontent">
        {/* ══════════════ TRAINING ══════════════ */}
        <section className={`pane${activeTab === "training" ? " on" : ""}`}>
          {/* ── §POT — sessions left (the hero) ── */}
          <div className="panel">
            <div className="panel-h">
              <span className="panel-h-ic ic-rose">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </span>
              <span className="panel-h-t">Sessions left</span>
            </div>
            <div className="panel-b">
              <div className={`pot-hero${(potView.remaining ?? 99) <= 2 ? " low" : ""}`}>
                <span className="pot-hero-fig">{potView.purchasedIsEstimate ? potView.estimatedRemaining : potView.remaining ?? "?"}</span>
                <span className="pot-hero-label">left</span>
                <span className="pot-hero-of">
                  {potView.used} of {potView.purchasedIsEstimate ? potView.estimatedPurchase : potView.purchased ?? "?"} used
                </span>
              </div>
              {potView.purchased != null && (
                <div className="pot-hero-bar">
                  <i style={{ width: `${Math.min(((potView.purchased - (potView.remaining ?? 0)) / potView.purchased) * 100, 100)}%` }} />
                </div>
              )}
              <p className="pot-hero-s">Only a completed workout takes one. Reschedules and cancellations don&apos;t, and nothing expires.</p>
              {potView.unreviewedCancellations > 0 && (
                <div className="mpot-note">
                  {potView.unreviewedCancellations} cancellation{potView.unreviewedCancellations === 1 ? "" : "s"} not counted — needs review
                </div>
              )}
            </div>
          </div>

          {/* ── §NEXT WORKOUT — what she is doing next ── */}
          {nextPool && (
            <div className="panel">
              <div className="panel-h">
                <span className="panel-h-ic teal">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
                <span className="panel-h-t">Next workout</span>
              </div>
              <div className="panel-b">
                <div className="nw">
                  <span className="nw-p">{nextPool.letter}</span>
                  <span className="nw-m">
                    <span className="nw-t">{nextPool.name}</span>
                    <span className="nw-s">
                      {nextPool.assignedDate
                        ? `Assigned · ${new Date(nextPool.assignedDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`
                        : "Not yet assigned"}
                    </span>
                  </span>
                </div>
                <div className="actbar-m">
                  <Link className="btn btn-outline" href={trainTargetId ? `/hub/m/train/${trainTargetId}` : "#"}>
                    See workout
                  </Link>
                  <Link className="btn btn-primary" href={trainTargetId ? `/hub/m/train/${trainTargetId}` : "#"}>
                    Start session
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── §QUEUE — after that ── */}
          {(() => {
            const queued = poolWorkouts.filter((w) => w.status === "unused" || w.status === "next").slice(0, 3);
            const totalQueued = poolWorkouts.filter((w) => w.status === "unused" || w.status === "next").length;
            if (queued.length === 0 && !nextPool) {
              /* ── §NOPLAN — the honest empty state ── */
              return (
                <div className="panel">
                  <div className="panel-h">
                    <span className="panel-h-ic teal">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </span>
                    <span className="panel-h-t">Next workout</span>
                  </div>
                  <div className="panel-b">
                    <div className="noplan-m">
                      <p className="noplan-m-t">No workouts assigned yet</p>
                      <p className="noplan-m-s">Nothing is queued for {firstName}, so nothing is shown here.</p>
                      <Link className="btn btn-outline" href={`/hub/clients/${clientNumber}`} style={{ width: "100%" }}>
                        Build queue on desktop
                      </Link>
                    </div>
                    {(potView.remaining ?? 0) > 0 && (
                      <div className="mrecon-m">
                        <span><b>{totalQueued} queued · {potView.purchasedIsEstimate ? potView.estimatedRemaining : potView.remaining ?? "?"} session{(potView.purchasedIsEstimate ? potView.estimatedRemaining : potView.remaining) !== 1 ? "s" : ""} left.</b> {totalQueued === 0 ? "Nothing queued." : ""}</span>
                      </div>
                    )}
                  </div>
                  <div className="panel-f" style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", background: "var(--hover)", fontSize: 12, color: "var(--muted)" }}>
                    Building a queue is a desk job — the phone says so rather than offering a version that doesn&apos;t work one-handed.
                  </div>
                </div>
              );
            }
            return (
              <div className="panel">
                <div className="panel-h">
                  <span className="panel-h-ic navy">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                  </span>
                  <span className="panel-h-t">After that</span>
                </div>
                <div className="panel-b" style={{ paddingTop: 2, paddingBottom: 2 }}>
                  {queued.map((w) => (
                    <button key={w.id} className="qrow-m" type="button">
                      <span className="qrow-m-p">{w.letter}</span>
                      <span className="qrow-m-w">{w.name}</span>
                      <span className="qrow-m-c">{ICO.chev}</span>
                    </button>
                  ))}
                  {totalQueued > 3 && (
                    <button className="qmore" type="button">
                      See all {totalQueued} in the queue ›
                    </button>
                  )}
                </div>
                <div className="panel-f" style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", background: "var(--hover)", fontSize: 12, color: "var(--muted)" }}>
                  {totalQueued} queued · {potView.purchasedIsEstimate ? potView.estimatedRemaining : potView.remaining ?? "?"} session{(potView.purchasedIsEstimate ? potView.estimatedRemaining : potView.remaining) !== 1 ? "s" : ""} left. The plan and the pot agree.
                </div>
              </div>
            );
          })()}

          {/* ── §BOOKED IN — the only dates in the model ── */}
          {calendarSessions.filter((s) => s.status === "scheduled").length > 0 && (
            <div className="panel">
              <div className="panel-h">
                <span className="panel-h-ic navy">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </span>
                <span className="panel-h-t">Booked in</span>
                <Link className="btn-link" href="/hub/m/calendar" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--rose)" }}>
                  Calendar ›
                </Link>
              </div>
              <div className="panel-b" style={{ paddingTop: 2, paddingBottom: 4 }}>
                {calendarSessions
                  .filter((s) => s.status === "scheduled")
                  .slice(0, 2)
                  .map((s) => {
                    const d = new Date(s.scheduledAt);
                    return (
                      <div key={s.id} className="brow-m">
                        <span className="bdate-m">
                          <b>{d.getDate()}</b>
                          <span>{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                        </span>
                        <span className="bmeta-m">
                          <b>{d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}{d.toDateString() === new Date().toDateString() ? " today" : ""}</b>
                          Will use {s.name}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── §SO FAR ── */}
          <div className="panel">
            <div className="panel-h">
              <span className="panel-h-t" style={{ marginLeft: 2 }}>So far</span>
            </div>
            <div className="panel-b">
              <div className="stats-m">
                <span>Done<b>{potView.completed}</b></span>
                <span>Pots<b>{potView.purchased != null ? Math.ceil(potView.used / (potView.purchased || 1)) : "—"}</b></span>
              </div>
            </div>
          </div>

          {/* ── Medical & compliance (collapsed into a compact card) ── */}
          {activeFlagCount > 0 && (
            <div className="panel">
              <div className="panel-h">
                <span className={`panel-h-ic ${activeFlagCount > 0 ? "danger" : "teal"}`}>
                  {activeFlagCount > 0 ? ICO.med : ICO.okLg}
                </span>
                <span>
                  <span className="panel-h-t">Medical &amp; compliance</span>
                  <span className="panel-h-s">{activeFlagCount} flag{activeFlagCount !== 1 ? "s" : ""} active</span>
                </span>
              </div>
              <div className="panel-b">
                {flags.filter((f) => f.tone !== "ok").slice(0, 3).map((f, i) => (
                  <div key={i} className={`flagcard ${f.tone}`}>
                    <span className="flag-ic">{flagIcon(f.tone)}</span>
                    <div>
                      <b>{f.title}</b>
                      {f.detail}
                    </div>
                  </div>
                ))}
                {flags.filter((f) => f.tone !== "ok").length > 3 && (
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                    +{flags.filter((f) => f.tone !== "ok").length - 3} more flag{flags.filter((f) => f.tone !== "ok").length - 3 !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Recent sessions ── */}
          {recent.length > 0 && (
            <div className="panel">
              <div className="panel-h">
                <span className="panel-h-ic teal">{ICO.hist}</span>
                <span>
                  <span className="panel-h-t">Recent sessions</span>
                  <span className="panel-h-s">Tap to read a past log</span>
                </span>
              </div>
              <div className="panel-b" style={{ paddingTop: 2, paddingBottom: 4 }}>
                {recent.slice(0, 3).map((h) => (
                  <Link key={h.id} className="hrow" href={`/hub/m/train/${h.id}`}>
                    <span className="hdate">
                      <b>{h.day ?? "—"}</b>
                      <span>{h.month}</span>
                    </span>
                    <span className="hbody">
                      <span className="hname">{h.name}</span>
                      <span className="hmeta">{h.sub}</span>
                    </span>
                    <span className="cchev">{ICO.chev}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="absent">
            <b>True admin stays on desktop</b>
            Documents, PAR-Q editing, cashflow, email updates and invoicing still live on the desktop
            hub. Client mode is for session-shaped work — training, booking, notes and review.{" "}
            <Link href={`/hub/clients/${clientNumber}`}>Open the full record on desktop</Link>.
          </div>
        </section>

        {/* ══════════════ CALENDAR ══════════════ */}
        <section className={`pane${activeTab === "calendar" ? " on" : ""}`}>
          <DayAgenda
            sessions={calendarSessions.map(
              (s): AgendaSession => ({
                id: s.id,
                scheduledAt: s.scheduledAt,
                name: s.name,
                status: s.status,
              })
            )}
            today={todayLocalISODate()}
            windowStart={todayLocalISODate()}
            windowEnd={shiftDay(todayLocalISODate(), 7)}
            scope="client"
            clientNumber={clientNumber}
          />
          <Link
            className="btn btn-outline agenda-add"
            href={`/hub/m/book?scope=client&client=${clientNumber}&day=${todayLocalISODate()}`}
            style={{ width: "100%" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Book for {firstName}
          </Link>
        </section>

        {/* ══════════════ NOTES ══════════════ */}
        <section className={`pane${activeTab === "notes" ? " on" : ""}`}>
          <ClientNotesPane
            clientId={clientId}
            clientName={clientName}
            exerciseNotes={exerciseNotes}
            sessionNotes={sessionNotes}
            pinnedNoteRefs={pinnedNoteRefs}
          />
        </section>
      </main>

      {/* CR-EF-113: 5-tab bottom bar — Training · Calendar · Documents · Comms · Notes */}
      <ClientTabBar
        clientNumber={clientNumber}
        activeTab={activeTab}
      />
    </>
  );
}
