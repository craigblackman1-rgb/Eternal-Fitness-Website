"use client";

import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import type { SessionStatus } from "@/types";
import type { AggregatedExerciseNote } from "@/lib/exercise-notes";
import type { SessionNoteData, PinnedNoteRef } from "@/types";
import type { ClientFlag } from "@/lib/mobile-client-flags";
import type { ExerciseTrendSummary } from "@/lib/progress";
import { DayAgenda, type AgendaSession } from "@/components/hub/DayAgenda";
import { ClientNotesPane } from "./ClientNotesPane";
import { ClientBookingPanel } from "@/components/hub/ClientBookingPanel";
import { todayLocalISODate, shiftDay } from "@/lib/schedule-dates";
import { toast } from "sonner";

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
  pool: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 9v12" />
    </svg>
  ),
  calendarTab: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M3 15h18M12 15v3" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

/* ── Helper: group sessions into Monday–Sunday weeks ── */

function mondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekKey(date: Date): string {
  const m = mondayOfWeek(date);
  return m.toISOString().slice(0, 10);
}

function weekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `Week of ${fmt(monday)}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ── Component ── */

type TabKey = "overview" | "sessions" | "pool" | "calendar" | "notes";

interface ClientModeViewProps {
  clientId: string;
  clientNumber: number;
  clientName: string;
  firstName: string;
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
  const [tab, setTab] = useState<TabKey>("overview");

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

  const switchToSessions = useCallback(() => setTab("sessions"), []);

  /* ── CR-EF-166: session move/cancel sheet ── */
  type MoveSheetTab = "move" | "cancel";
  type CancelRoute = "charge" | "free" | "reschedule";
  interface MoveSlot { fullDateTime: string; label: string; time: string; isFree: boolean; }

  const [moveSessionOpen, setMoveSessionOpen] = useState(false);
  const [moveSessionData, setMoveSessionData] = useState<{ id: string; name: string; scheduledAt: string; cancelReason: string | null } | null>(null);
  const [moveTab, setMoveTab] = useState<MoveSheetTab>("move");
  const [cancelRoute, setCancelRoute] = useState<CancelRoute>("free");
  const [moveSlots, setMoveSlots] = useState<MoveSlot[]>([]);
  const [moveSlotsLoading, setMoveSlotsLoading] = useState(false);
  const [moveSelectedSlot, setMoveSelectedSlot] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("Illness");
  const [otherReason, setOtherReason] = useState("");
  const [moveSaving, setMoveSaving] = useState(false);
  const moveAbortRef = useRef<AbortController | null>(null);

  const handleSessionAction = useCallback((session: { id: string; name: string; scheduledAt: string | null; cancelReason: string | null }) => {
    setMoveSessionData({ id: session.id, name: session.name, scheduledAt: session.scheduledAt ?? "", cancelReason: session.cancelReason });
    setMoveTab("move");
    setCancelRoute("free");
    setMoveSelectedSlot(null);
    setCancelReason("Illness");
    setOtherReason("");
    setMoveSessionOpen(true);
  }, []);

  useEffect(() => {
    if (!moveSessionOpen || moveTab !== "move" || !moveSessionData) return;
    const controller = new AbortController();
    moveAbortRef.current?.abort();
    moveAbortRef.current = controller;
    setMoveSlotsLoading(true);

    fetch(`/api/availability/slots?from=${moveSessionData.scheduledAt.slice(0, 10)}&weeks=3`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const slots: MoveSlot[] = [];
        const booked = new Set<string>();
        for (const week of data.weeks ?? []) {
          for (const day of week.days ?? []) {
            if (day.state !== "open") continue;
            for (const slot of day.slots ?? []) {
              const iso = slot.startUtc;
              const dt = new Date(iso);
              const label = dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
              const time = slot.startLocal;
              const key = `${day.date} ${time}`;
              const isFree = !booked.has(key);
              if (isFree) booked.add(key);
              slots.push({ fullDateTime: iso, label, time, isFree });
            }
          }
        }
        setMoveSlots(slots);
        const firstFree = slots.find((s) => s.isFree);
        if (firstFree) setMoveSelectedSlot(firstFree.fullDateTime);
      })
      .catch(() => { if (!controller.signal.aborted) setMoveSlots([]); })
      .finally(() => { if (!controller.signal.aborted) setMoveSlotsLoading(false); });

    return () => { controller.abort(); };
  }, [moveSessionOpen, moveTab, moveSessionData]);

  const handleMoveConfirm = useCallback(async () => {
    if (!moveSelectedSlot || !moveSessionData) return;
    setMoveSaving(true);
    try {
      const res = await fetch(`/api/sessions/${moveSessionData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: moveSelectedSlot }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to move session"); }
      toast.success("Session moved");
      setMoveSessionOpen(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to move session"); }
    finally { setMoveSaving(false); }
  }, [moveSelectedSlot, moveSessionData]);

  const handleCancelConfirm = useCallback(async () => {
    if (!moveSessionData) return;
    if (cancelRoute === "reschedule") { setMoveTab("move"); return; }
    setMoveSaving(true);
    try {
      const reason = cancelReason === "Other" && otherReason ? otherReason : cancelReason;
      const body: Record<string, unknown> = { cancelled_at: new Date().toISOString(), cancel_reason: reason };
      if (cancelRoute === "free") body.charged_free = "free";
      const res = await fetch(`/api/sessions/${moveSessionData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to cancel session"); }
      toast.success(cancelRoute === "free" ? "Cancelled — free" : "Cancelled — charged to balance");
      setMoveSessionOpen(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to cancel session"); }
    finally { setMoveSaving(false); }
  }, [moveSessionData, cancelRoute, cancelReason, otherReason]);

  /* ── Sessions view: group by week ── */
  const { upcomingSessions, unscheduledSessions, pastSessions, upcomingCount, pastCount } = useMemo(() => {
    const now = new Date();
    const upcoming: SessionView[] = [];
    const unscheduled: SessionView[] = [];
    const past: SessionView[] = [];

    for (const s of sessionsView) {
      if (!s.scheduledAt) {
        unscheduled.push(s);
      } else if (new Date(s.scheduledAt).getTime() >= now.getTime() || s.isToday) {
        upcoming.push(s);
      } else {
        past.push(s);
      }
    }

    return {
      upcomingSessions: upcoming,
      unscheduledSessions: unscheduled,
      pastSessions: past,
      upcomingCount: upcoming.length,
      pastCount: past.length,
    };
  }, [sessionsView]);

  /* ── Sessions view: group by week ── */
  const upcomingWeeks = useMemo(() => {
    const map = new Map<string, { monday: Date; sessions: SessionView[] }>();
    for (const s of upcomingSessions) {
      if (!s.scheduledAt) continue;
      const d = new Date(s.scheduledAt);
      const key = weekKey(d);
      if (!map.has(key)) {
        map.set(key, { monday: mondayOfWeek(d), sessions: [] });
      }
      map.get(key)!.sessions.push(s);
    }
    return Array.from(map.values()).sort((a, b) => a.monday.getTime() - b.monday.getTime());
  }, [upcomingSessions]);

  const pastWeeks = useMemo(() => {
    const map = new Map<string, { monday: Date; sessions: SessionView[] }>();
    for (const s of pastSessions) {
      if (!s.scheduledAt) continue;
      const d = new Date(s.scheduledAt);
      const key = weekKey(d);
      if (!map.has(key)) {
        map.set(key, { monday: mondayOfWeek(d), sessions: [] });
      }
      map.get(key)!.sessions.push(s);
    }
    return Array.from(map.values()).sort((a, b) => b.monday.getTime() - a.monday.getTime());
  }, [pastSessions]);

  /* ── Pool view ── */
  const nextPool = poolWorkouts.find((w) => w.status === "next");
  const poolUsed = poolWorkouts.filter((w) => w.status === "used").length;
  const poolAssigned = poolWorkouts.filter((w) => w.status === "assigned").length;

  const tabs: { key: TabKey; label: string; icon: ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: ICO.overview },
    { key: "sessions", label: "Sessions", icon: ICO.sessions },
    { key: "pool", label: "Pool", icon: ICO.pool, badge: unusedPoolCount },
    { key: "calendar", label: "Calendar", icon: ICO.calendarTab },
    { key: "notes", label: "Notes", icon: ICO.notes },
  ];

  return (
    <>
      <main className="mcontent">
        {/* ══════════════ OVERVIEW ══════════════ */}
        <section className={`pane${tab === "overview" ? " on" : ""}`}>
          <div className="panel">
            <div className="panel-h">
              <span className={`panel-h-ic ${activeFlagCount > 0 ? "danger" : "teal"}`}>
                {activeFlagCount > 0 ? ICO.med : ICO.okLg}
              </span>
              <span>
                <span className="panel-h-t">Medical &amp; compliance</span>
                <span className="panel-h-s">{panelSubtitle}</span>
              </span>
              <span className="panel-h-x">
                <button className="expand-all" onClick={toggleAllAcc}>
                  {allOpen ? "Collapse all" : "Expand all"}
                </button>
              </span>
            </div>
            <div className="panel-b">
              {/* Pinned contraindications — never collapsed */}
              {contraCount > 0 && (
                <>
                  <div className="pinned-lbl">⚠ Contraindications — always visible</div>
                  {contraindications.map((f, i) => (
                    <div key={i} className={`flagcard ${f.tone}`}>
                      <span className="flag-ic">{flagIcon(f.tone)}</span>
                      <div>
                        <b>{f.title}</b>
                        {f.detail}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Clinical family */}
              {clinicalGroups.length > 0 && (
                <>
                  <div className="fam-lbl">Clinical</div>
                  {clinicalGroups.map((g) => {
                    const items = groupItems.get(g.key) ?? [];
                    const tone = worstTone(items);
                    const isOpen = !!accOpen[g.key];
                    return (
                      <div key={g.key} className="acc" data-open={isOpen ? "true" : "false"}>
                        <button className="acc-h" aria-expanded={isOpen} onClick={() => toggleAcc(g.key)}>
                          <span className={`acc-dot dot-${tone}`} />
                          <span className="acc-t">{g.title}</span>
                          <span className="acc-count">{items.length}</span>
                          <span className="acc-ch">▾</span>
                        </button>
                        <div className="acc-b">
                          {items.map((f, i) => (
                            <div key={i} className={`flagcard ${f.tone}`}>
                              <span className="flag-ic">{flagIcon(f.tone)}</span>
                              <div>
                                <b>{f.title}</b>
                                {f.detail}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Compliance family */}
              {complianceGroups.length > 0 && (
                <>
                  <div className="fam-lbl">Compliance</div>
                  {complianceGroups.map((g) => {
                    const items = groupItems.get(g.key) ?? [];
                    const tone = worstTone(items);
                    const isOpen = !!accOpen[g.key];
                    return (
                      <div key={g.key} className="acc" data-open={isOpen ? "true" : "false"}>
                        <button className="acc-h" aria-expanded={isOpen} onClick={() => toggleAcc(g.key)}>
                          <span className={`acc-dot dot-${tone}`} />
                          <span className="acc-t">{g.title}</span>
                          <span className="acc-count">{items.length}</span>
                          <span className="acc-ch">▾</span>
                        </button>
                        <div className="acc-b">
                          {items.map((f, i) => (
                            <div key={i} className={`flagcard ${f.tone}`}>
                              <span className="flag-ic">{flagIcon(f.tone)}</span>
                              <div>
                                <b>{f.title}</b>
                                {f.detail}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Empty state */}
              {contraCount === 0 && visibleGroups.length === 0 && (
                <div className="pin-empty">
                  Nothing recorded to flag.
                </div>
              )}

              {/* CR-EF-113: dual action — Train primary, Session record one tap away */}
              {trainTargetId && (
                <div className="actbar">
                  <Link className="btn btn-primary" href={`/hub/m/train/${trainTargetId}`}>
                    Train {firstName}
                  </Link>
                  <button className="btn btn-outline" onClick={switchToSessions}>
                    Session record
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CR-EF-168: Personal-best summary tile */}
          {exerciseTrendSummary && exerciseTrendSummary.totalExercisesLogged > 0 && (
            <div className="panel panel-tap" style={{ cursor: "default" }}>
              <div className="panel-h">
                <span className="panel-h-ic teal">{ICO.hist}</span>
                <span>
                  <span className="panel-h-t">Progress summary</span>
                  <span className="panel-h-s">
                    {exerciseTrendSummary.personalBests} personal best{exerciseTrendSummary.personalBests !== 1 ? "s" : ""}
                    {exerciseTrendSummary.heaviestLift ? ` · heaviest ${exerciseTrendSummary.heaviestLift}` : ""}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* CR-EF-113: openable sessions summary — the specific complaint fix */}
          <button className="panel panel-tap" onClick={switchToSessions} aria-label="Open Sessions">
            <div className="panel-h">
              <span className="panel-h-ic navy">{ICO.calendar}</span>
              <span>
                <span className="panel-h-t">Sessions</span>
                <span className="panel-h-s">
                  {block
                    ? potView.purchasedIsEstimate
                      ? `${potView.used} of ${potView.estimatedPurchase} used (est.) · ${potView.estimatedRemaining} remaining (est.)`
                      : potView.purchased != null
                        ? `${potView.used} of ${potView.purchased} used · ${potView.remaining} remaining`
                        : `${potView.used} used · purchased not recorded`
                    : "No active programme"}
                </span>
              </span>
              <span className="panel-chev">{ICO.chev}</span>
            </div>
            <div className="panel-b">
              {block?.focus && (
                <div className="kv" style={{ paddingTop: 0 }}>
                  <span className="kv-k">Focus</span>
                  <span className="kv-v">{block.focus}</span>
                </div>
              )}
              {block && (
                <>
                  <div className="blockbar">
                    <i style={{ width: `${block.pct}%` }} />
                  </div>
                  <div className="blockmeta">
                    <span>Tap to see which sessions, and what&apos;s attached</span>
                    <span>{potView.purchasedIsEstimate ? potView.estimatedRemaining : potView.remaining ?? "?"}{potView.purchasedIsEstimate ? " (est.)" : ""} left</span>
                  </div>
                </>
              )}
              {!block && (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  Nothing has been planned for {firstName} yet — this isn&apos;t the same as being up to date.
                </div>
              )}
            </div>
          </button>

          {/* CR-EF-167: programme queue strip */}
          {programmeQueue && (
            <div className="panel">
              <div className="panel-h">
                <span className="panel-h-ic">{ICO.block}</span>
                <span>
                  <span className="panel-h-t">Programme queue</span>
                  <span className="panel-h-s">{programmeQueue.programName} · {programmeQueue.slotLetters.length} slot{programmeQueue.slotLetters.length !== 1 ? "s" : ""} in rotation</span>
                </span>
              </div>
              <div className="panel-b">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                    Week {programmeQueue.currentWeek} of {programmeQueue.totalWeeks}
                  </span>
                  {programmeQueue.nextSlotLabel && (
                    <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      · next: {programmeQueue.nextSlotLabel}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {programmeQueue.slotLetters.map((letter, i) => (
                    <span key={i} style={{
                      width: 36, height: 30, borderRadius: "var(--r-control)", border: "1px solid var(--border)",
                      background: "var(--card)", display: "grid", placeItems: "center",
                      fontSize: 13, fontWeight: 800, color: "var(--ink)",
                    }}>{letter}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-h">
              <span className="panel-h-ic">{ICO.pin}</span>
              <span>
                <span className="panel-h-t">Pinned note</span>
                <span className="panel-h-s">The note surfaced here</span>
              </span>
            </div>
            <div className="panel-b">
              {pinnedNote ? (
                <div className="flagcard ok">
                  <span className="flag-ic">{ICO.pin}</span>
                  <div>
                    <b>{pinnedNote.text.slice(0, 60)}{pinnedNote.text.length > 60 ? "…" : ""}</b>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                      Added on {new Date(pinnedNote.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {pinnedNote.author ? ` · ${pinnedNote.author}` : ""} · pinned
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pin-empty">
                  No pinned note yet — pin a note from the Notes tab to surface it here.
                </div>
              )}
            </div>
          </div>

          {recent.length > 0 && (
            <div className="panel">
              <div className="panel-h">
                <span className="panel-h-ic teal">{ICO.hist}</span>
                <span>
                  <span className="panel-h-t">Recent sessions</span>
                  <span className="panel-h-s">Tap to read a past log — read-only</span>
                </span>
              </div>
              <div className="panel-b" style={{ paddingTop: 2, paddingBottom: 4 }}>
                {recent.map((h) => (
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

        {/* ══════════════ SESSIONS ══════════════ */}
        <section className={`pane${tab === "sessions" ? " on" : ""}`}>
          {/* Pot strip */}
          <div className="mpot">
            <div className="mpot-row">
              <span className="mpot-n">{potView.purchasedIsEstimate ? potView.estimatedRemaining : potView.remaining ?? "?"}</span>
              <span className="mpot-l">left</span>
              <span className="mpot-side">
                <b>{potView.used}</b> used{potView.purchasedIsEstimate ? <> of <b>{potView.estimatedPurchase}</b> (est.)</> : potView.purchased != null ? <> of <b>{potView.purchased}</b></> : null}
                <br />
                {potView.bookedAhead} booked ahead
              </span>
            </div>
            {potView.purchased != null ? (
              <div className="mbar">
                {potView.completed > 0 && (
                  <span className="mseg done" style={{ width: `${(potView.completed / potView.purchased) * 100}%` }} />
                )}
                {potView.chargedCancellations > 0 && (
                  <span className="mseg charged" style={{ width: `${(potView.chargedCancellations / potView.purchased) * 100}%` }} />
                )}
                {potView.bookedAhead > 0 && (
                  <span className="mseg booked" style={{ width: `${(potView.bookedAhead / potView.purchased) * 100}%` }} />
                )}
                {(() => {
                  const notBooked = Math.max((potView.remaining ?? 0) - potView.bookedAhead, 0);
                  return notBooked > 0 ? (
                    <span
                      className="mseg free"
                      style={{
                        width: `${(notBooked / potView.purchased) * 100}%`,
                      }}
                    />
                  ) : null;
                })()}
              </div>
            ) : null}
            <div className="mpot-legend">
              <span className="mleg">
                <i style={{ background: "var(--teal)" }} />Completed <b>{potView.completed}</b>
              </span>
              {potView.chargedCancellations > 0 && (
                <span className="mleg">
                  <i style={{ background: "var(--s-danger)" }} />Charged <b>{potView.chargedCancellations}</b>
                </span>
              )}
              <span className="mleg">
                <i style={{ background: "var(--rose)" }} />Booked <b>{potView.bookedAhead}</b>
              </span>
              <span className="mleg">
                <i style={{ background: "var(--hover)" }} />Not booked <b>{Math.max((potView.remaining ?? 0) - potView.bookedAhead, 0)}</b>
              </span>
            </div>
            {potView.unreviewedCancellations > 0 && (
              <div className="mpot-note">
                {potView.unreviewedCancellations} cancellation{potView.unreviewedCancellations === 1 ? "" : "s"} not counted above — needs review
              </div>
            )}
          </div>

          {/* Upcoming */}
          {upcomingSessions.length > 0 && (
            <>
              <div className="sec-lbl">
                <h2>Upcoming</h2>
                <span className="cnt">{upcomingCount} session{upcomingCount !== 1 ? "s" : ""}</span>
              </div>
              {upcomingWeeks.map((wk) => (
                <div key={weekKey(wk.monday)}>
                  <div className="week-band">
                    <span className="week-band-t">{weekLabel(wk.monday)}</span>
                  </div>
                  <div className="blist">
                    {wk.sessions.map((s) => (
                      <SessionRow key={s.id} session={s} firstName={firstName} nextPool={s.name === "No workout assigned yet" ? nextPool : undefined} clientNumber={clientNumber}
                        onAction={s.status === "scheduled" && s.scheduledAt ? () => handleSessionAction({ id: s.id, name: s.name, scheduledAt: s.scheduledAt, cancelReason: s.cancelReason }) : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Not yet booked */}
          {unscheduledSessions.length > 0 && (
            <>
              <div className="sec-lbl plan">
                <h2>Not yet booked</h2>
                <span className="cnt">{unscheduledSessions.length} session{unscheduledSessions.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="blist">
                <div className="srow plan">
                  <div className="srow-date" style={{ borderRight: 0 }}>
                    <div className="srow-d" style={{ color: "var(--muted)" }}>—</div>
                  </div>
                  <div className="srow-body">
                    <div className="srow-empty">
                      Sessions {unscheduledSessions[0]?.position ?? "?"}–{unscheduledSessions[unscheduledSessions.length - 1]?.position ?? "?"} of {unscheduledSessions[0]?.total ?? "?"}
                    </div>
                    <div className="srow-sub">
                      Nothing booked into Outlook yet — will appear here with real dates once they are.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Already happened */}
          {pastSessions.length > 0 && (
            <>
              <div className="sec-lbl">
                <h2>Already happened</h2>
                <span className="cnt">{pastCount} session{pastCount !== 1 ? "s" : ""}</span>
              </div>
              {pastWeeks.map((wk) => (
                <div key={weekKey(wk.monday)}>
                  <div className="week-band">
                    <span className="week-band-t">{weekLabel(wk.monday)}</span>
                  </div>
                  <div className="blist">
                    {wk.sessions.map((s) => (
                      <SessionRow key={s.id} session={s} firstName={firstName} clientNumber={clientNumber} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {sessionsView.length === 0 && (
            <div className="empty">
              <div className="empty-ic">{ICO.sessions}</div>
              <p className="empty-t">No sessions yet</p>
              <p className="empty-d">
                Nothing has been planned for {firstName} yet — this isn&apos;t the same as being up to date.
              </p>
            </div>
          )}
        </section>

        {/* ══════════════ POOL ══════════════ */}
        <section className={`pane${tab === "pool" ? " on" : ""}`}>
          {/* Next-up card */}
          {nextPool && (
            <div className="nextcard">
              <div className="nextcard-top">
                <span className="nextcard-let">{nextPool.letter}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="nextcard-lbl">Up next</div>
                  <div className="nextcard-n">{nextPool.name}</div>
                  <div className="nextcard-s">
                    {nextPool.assignedDate
                      ? `Assigned to ${formatShortDate(nextPool.assignedDate)}`
                      : "Not delivered yet"}
                  </div>
                </div>
              </div>
              <div className="nextcard-b">
                {earliestUnattached ? (
                  <div className="nextcard-target">
                    {ICO.calSm}
                    <span>
                      Earliest session without a workout is <b>{formatShortDate(earliestUnattached.scheduledAt)}</b>
                    </span>
                  </div>
                ) : nextPool.assignedDate ? (
                  <div className="nextcard-target">
                    {ICO.calSm}
                    <span>
                      Assigned to <b>{formatShortDate(nextPool.assignedDate)}</b>
                    </span>
                  </div>
                ) : null}
                <button className="mbtn" onClick={() => setTab("sessions")}>
                  View sessions
                </button>
                <button className="mbtn ghost" onClick={() => setTab("sessions")}>
                  Choose a different session
                </button>
              </div>
            </div>
          )}

          {/* Workout sequence */}
          <div className="sec-lbl">
            <h2>Workout sequence</h2>
            <span className="cnt">
              {poolUsed} used · {poolAssigned} assigned · {unusedPoolCount} unused
            </span>
          </div>
          <div className="pool-list">
            {poolWorkouts.map((w) => (
              <div
                key={w.id}
                className={`pool-item${w.status === "used" ? " done" : ""}${w.status === "assigned" ? " assigned" : ""}${w.status === "next" ? " next" : ""}`}
              >
                <span className="pool-let">{w.letter}</span>
                <div className="pool-body">
                  <div className="pool-n">{w.name}</div>
                  <div className="pool-s">
                    {w.status === "used" && w.deliveryDate && `Delivered ${formatShortDate(w.deliveryDate)}`}
                    {w.status === "assigned" && w.assignedDate && `Attached to ${formatShortDate(w.assignedDate)}`}
                    {w.status === "next" && "Not used yet"}
                    {w.status === "unused" && "Not used yet"}
                  </div>
                </div>
                <span className={`pool-tag ${w.status === "used" ? "used" : w.status === "assigned" ? "assig" : w.status === "next" ? "nextup" : "unused"}`}>
                  {w.status === "used" && "Used"}
                  {w.status === "assigned" && "Assigned"}
                  {w.status === "next" && "Next up"}
                  {w.status === "unused" && "Unused"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════ CALENDAR ══════════════ */}
        <section className={`pane${tab === "calendar" ? " on" : ""}`}>
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
        <section className={`pane${tab === "notes" ? " on" : ""}`}>
          <ClientNotesPane
            clientId={clientId}
            clientName={clientName}
            exerciseNotes={exerciseNotes}
            sessionNotes={sessionNotes}
            pinnedNoteRefs={pinnedNoteRefs}
          />
        </section>
      </main>

      {/* CR-EF-113: 5-tab bottom bar — Overview · Sessions · Pool · Calendar · Notes */}
      <nav className="tabbar" aria-label="Client">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? " on" : ""}`}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "true" : undefined}
          >
            {t.icon}
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="tab-badge">{t.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* CR-EF-166: session move/cancel bottom sheet */}
      {moveSessionOpen && moveSessionData && (
        <>
          <div className="scrim" onClick={() => { if (!moveSaving) setMoveSessionOpen(false); }} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Move or cancel session">
            <div className="grab"><i /></div>
            <header className="sh-head">
              <div className="sh-title">
                <h1>{moveTab === "move" ? "Move session" : "Cancel session"}</h1>
                <p>{moveSessionData.name} · {new Date(moveSessionData.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
              </div>
              <button className="sh-close" onClick={() => { if (!moveSaving) setMoveSessionOpen(false); }} aria-label="Close">✕</button>
            </header>

            {/* Tab bar */}
            <div className="modes">
              <button className={`mode-btn${moveTab === "move" ? " on" : ""}`} onClick={() => setMoveTab("move")}>Move it</button>
              <button className={`mode-btn${moveTab === "cancel" ? " on" : ""}`} onClick={() => setMoveTab("cancel")}>Cancel it</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 14, paddingBottom: 108 }}>
              {/* ── Move tab ── */}
              {moveTab === "move" && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 8 }}>
                    New date and time
                  </div>
                  {moveSlotsLoading ? (
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading available slots…</p>
                  ) : moveSlots.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>No available slots found in the next 3 weeks.</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {moveSlots.map((slot) => {
                        const isSel = slot.fullDateTime === moveSelectedSlot;
                        return (
                          <button key={slot.fullDateTime} onClick={() => setMoveSelectedSlot(slot.fullDateTime)}
                            style={{
                              border: `1px solid ${isSel ? "var(--rose)" : "var(--border)"}`,
                              borderRadius: "var(--r-nested)",
                              padding: "8px 12px",
                              background: isSel ? "var(--s-primary-bg)" : "var(--card)",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textAlign: "left",
                              boxShadow: isSel ? "inset 0 0 0 1px var(--rose)" : "none",
                            }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? "var(--rose)" : "var(--ink)" }}>{slot.label}</div>
                            <div style={{ fontSize: 11.5, color: isSel ? "var(--rose)" : "var(--muted)", marginTop: 2 }}>{slot.time}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Programme unaffected reassurance */}
                  <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: "var(--r-nested)", background: "var(--s-success-bg)", border: "1px solid var(--s-success-bd)", fontSize: 13, fontWeight: 600, color: "var(--teal)" }}>
                    Her programme is unaffected — <b>{moveSessionData.name}</b> still delivers at her next session. Moving this session does not touch the queue.
                  </div>
                </div>
              )}

              {/* ── Cancel tab ── */}
              {moveTab === "cancel" && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 8 }}>
                    How should this cancellation be handled?
                  </div>
                  {/* Three-way route cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {([
                      { route: "charge" as const, title: "Charge to balance", desc: "Uses one session. Remaining drops by 1." },
                      { route: "free" as const, title: "Free cancellation", desc: "Doesn't use a session. No change." },
                      { route: "reschedule" as const, title: "Reschedule", desc: "Move to a new date. No change." },
                    ]).map((opt) => (
                      <button key={opt.route} onClick={() => setCancelRoute(opt.route)}
                        style={{
                          border: `1px solid ${cancelRoute === opt.route ? "var(--rose)" : "var(--border)"}`,
                          borderRadius: "var(--r-nested)",
                          padding: "10px 8px",
                          background: cancelRoute === opt.route ? "var(--s-primary-bg)" : "var(--card)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textAlign: "center",
                          boxShadow: cancelRoute === opt.route ? "inset 0 0 0 1px var(--rose)" : "none",
                        }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: cancelRoute === opt.route ? "var(--rose)" : "var(--ink)" }}>{opt.title}</div>
                        <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  {/* Consequence preview */}
                  <div style={{ padding: "10px 12px", borderRadius: "var(--r-nested)", background: "var(--s-success-bg)", border: "1px solid var(--s-success-bd)", fontSize: 13, fontWeight: 600, color: "var(--teal)", marginBottom: 12 }}>
                    {cancelRoute === "charge"
                      ? `${potView.remaining ?? "?"} remaining → ${Math.max(0, (potView.remaining ?? 1) - 1)} remaining`
                      : cancelRoute === "free"
                        ? `${potView.remaining ?? "?"} remaining → ${potView.remaining ?? "?"} remaining (no change)`
                        : `${potView.remaining ?? "?"} remaining → ${potView.remaining ?? "?"} remaining (date changes only)`}
                  </div>
                  {/* Reason */}
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 6 }}>
                    Reason
                  </div>
                  <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                    style={{ width: "100%", height: 40, border: "1px solid var(--field-border)", borderRadius: "var(--r-nested)", padding: "0 10px", fontFamily: "inherit", fontSize: 14, color: "var(--ink)", background: "var(--card)" }}>
                    {["Illness", "Client request", "Esther unavailable", "Other"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {cancelReason === "Other" && (
                    <input type="text" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} placeholder="Specify reason"
                      style={{ width: "100%", height: 40, border: "1px solid var(--field-border)", borderRadius: "var(--r-nested)", padding: "0 10px", fontFamily: "inherit", fontSize: 14, color: "var(--ink)", background: "var(--card)", marginTop: 8 }} />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 14px", borderTop: "1px solid var(--border)", background: "var(--card)" }}>
              <button onClick={() => setMoveSessionOpen(false)} disabled={moveSaving}
                style={{ height: 44, padding: "0 14px", borderRadius: "var(--r-nested)", border: "1px solid var(--border)", background: "var(--card)", color: "var(--muted)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: moveSaving ? 0.5 : 1 }}>
                Back
              </button>
              <button onClick={moveTab === "move" ? handleMoveConfirm : handleCancelConfirm}
                disabled={moveSaving || (moveTab === "move" && !moveSelectedSlot)}
                style={{
                  height: 44, padding: "0 16px", borderRadius: "var(--r-nested)", border: "0",
                  background: moveTab === "move" ? "var(--rose)" : "var(--s-danger)",
                  color: "var(--color-white)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  opacity: moveSaving || (moveTab === "move" && !moveSelectedSlot) ? 0.5 : 1,
                }}>
                {moveSaving ? "Saving…" : moveTab === "move" ? "Move session" : cancelRoute === "reschedule" ? "Reschedule" : "Cancel session"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ── Session row sub-component ── */

function SessionRow({ session: s, firstName, nextPool, clientNumber, onAction }: { session: SessionView; firstName: string; nextPool?: PoolWorkoutView; clientNumber: number; onAction?: () => void }) {
  const positionLabel = s.position != null && s.total != null ? `Session ${s.position} of ${s.total}` : null;
  const isCompleted = s.status === "completed";
  const isCancelled = s.status === "cancelled";
  const isCharged = s.chargedFree === "charged";
  const isFree = s.chargedFree === "free";

  let statusPillClass = "";
  let statusPillLabel = "";
  let statusPillIcon: ReactNode = null;

  if (isCompleted) {
    statusPillClass = "completed";
    statusPillLabel = "Completed";
    statusPillIcon = ICO.check;
  } else if (isCancelled && isCharged) {
    statusPillClass = "charged";
    statusPillLabel = "Charged";
    statusPillIcon = ICO.xCircle;
  } else if (isCancelled && isFree) {
    statusPillClass = "freecx";
    statusPillLabel = "Cancelled — free";
    statusPillIcon = ICO.xCircle;
  } else if (isCancelled) {
    statusPillClass = "unreviewed";
    statusPillLabel = "Cancelled — needs review";
    statusPillIcon = ICO.warn;
  } else if (s.scheduledAt && !isCancelled) {
    statusPillClass = "booked";
    statusPillLabel = "Booked";
    statusPillIcon = ICO.calSm;
  }

  const subParts: string[] = [];
  if (positionLabel) subParts.push(positionLabel);
  if (s.isToday) subParts.push("today");
  if (s.scheduledAt && !isCancelled && !isCompleted && s.name === "No workout assigned yet") {
    subParts.push("booked via Outlook");
  }

  return (
    <div className={`srow${s.isToday ? " today" : ""}${isCancelled ? " cx" : ""}`}>
      <div className="srow-date">
        <div className="srow-d">{s.dayOfMonth ?? "—"}</div>
        {s.dayOfWeek && <div className="srow-dow">{s.dayOfWeek}</div>}
        {s.time && <div className="srow-time">{s.time}</div>}
        {onAction && (
          <button className="srow-action" onClick={(e) => { e.stopPropagation(); onAction(); }} aria-label="Move or cancel session">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        )}
      </div>
      <div className="srow-body">
        {s.name === "No workout assigned yet" ? (
          <div className="srow-empty">{s.name}</div>
        ) : (
          <div className="srow-name">{s.name}</div>
        )}
        <div className="srow-sub">{subParts.join(" · ")}</div>
        <div className="srow-flags">
          {statusPillLabel && (
            <span className={`s-pill ${statusPillClass}`}>
              {statusPillIcon}
              {statusPillLabel}
            </span>
          )}
          {isCompleted && <span className="cost-flag minus">−1</span>}
          {isCharged && <span className="cost-flag minus">−1</span>}
          {isFree && <span className="cost-flag zero">no session used</span>}
          {isCancelled && !isCharged && !isFree && <span className="cost-flag unreviewed">? pending review</span>}
          {s.name === "No workout assigned yet" && nextPool && (
            <span className="next-hint">
              {ICO.arrowRight}
              Up next: {nextPool.name}
            </span>
          )}
          {s.subSessionCount > 0 && (
            <span className="cost-flag" style={{ color: "var(--rose, #c1839f)", background: "rgba(193,131,159,.1)", border: "1px solid rgba(193,131,159,.2)" }}>
              +{s.subSessionCount} supplementary
            </span>
          )}
        </div>
        {s.name === "No workout assigned yet" && nextPool && (
          <Link className="mfill-btn" href={`/hub/m/clients/${clientNumber}/add-workout`}>Add workout</Link>
        )}
      </div>
    </div>
  );
}
