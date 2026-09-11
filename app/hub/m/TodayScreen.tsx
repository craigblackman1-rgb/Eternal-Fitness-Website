"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DesktopLink } from "@/components/hub/DesktopLink";
import { toast } from "sonner";
import type { Task } from "@/types";
import type { TodayEntry } from "./page";
import { deriveSessionChip } from "@/lib/session-chip";

// ── date/time helpers (mirrors ScheduleCalendar) ───────────────

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayISO(): string {
  return toLocalISODate(new Date());
}

function isoToLocalDate(iso: string): string {
  return toLocalISODate(new Date(iso));
}

function shiftDay(isoDate: string, delta: number): string {
  const [y, mo, d] = isoDate.split("-").map(Number);
  const next = new Date(y, mo - 1, d);
  next.setDate(next.getDate() + delta);
  return toLocalISODate(next);
}

function headingFor(isoDate: string): string {
  const [y, mo, d] = isoDate.split("-").map(Number);
  if (isoDate === todayISO()) return "Today";
  if (isoDate === shiftDay(todayISO(), 1)) return "Tomorrow";
  if (isoDate === shiftDay(todayISO(), -1)) return "Yesterday";
  return new Date(y, mo - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function subFor(isoDate: string): string {
  const [y, mo, d] = isoDate.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTimeRange(iso: string, durationMinutes: number): { start: string; end: string } {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { start: fmt(start), end: fmt(end) };
}

// ── conflict detection (reuses ScheduleCalendar's exact logic) ──

function findConflictIds(entries: TodayEntry[]): Set<string> {
  const conflicts = new Set<string>();
  const ranges = entries.map((e) => {
    const start = new Date(e.scheduledAt).getTime();
    return { e, start, end: start + e.durationMinutes * 60_000 };
  });
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i];
      const b = ranges[j];
      if (a.e.clientId && b.e.clientId && a.e.clientId === b.e.clientId) continue;
      if (a.start < b.end && b.start < a.end) {
        conflicts.add(a.e.id);
        conflicts.add(b.e.id);
      }
    }
  }
  return conflicts;
}

// ── task due helpers ────────────────────────────────────────────

function daysUntilDue(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function dueLabel(dueDate: string, viewedDay: string) {
  const diff = daysUntilDue(dueDate);
  if (diff < 0) return { cls: "overdue", text: `${Math.abs(diff)}d overdue` };
  if (dueDate === viewedDay) return { cls: "today", text: "Due today" };
  return { cls: "soon", text: `Due ${headingFor(dueDate).toLowerCase()}` };
}

// ── icons (inline SVG, matching mockup) ────────────────────────

const ICO = {
  warn: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
      <path d="M12 9v4M12 17h.01"/>
    </svg>
  ),
  warnSm: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
      <path d="M12 9v4M12 17h.01"/>
    </svg>
  ),
  med: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 12h18"/>
    </svg>
  ),
  chev: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  check: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  cal: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  live: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6"/>
    </svg>
  ),
  left: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  right: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  monitor: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  calSm: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  checkSm: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
};

// ── Main component ─────────────────────────────────────────────

interface TodayScreenProps {
  entries: TodayEntry[];
  tasks: Task[];

  currentUserName: string | null;
  /** BUG-EF-135 — the first in-progress session for today, if any. */
  resumeSession: TodayEntry | null;
}

export function TodayScreen({ entries, tasks, currentUserName, resumeSession }: TodayScreenProps) {
  const router = useRouter();
  const [day, setDay] = useState<string>(todayISO());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [taskBusy, setTaskBusy] = useState<Set<string>>(new Set());
  // Same accordion primitive as TrainScreen's exercise sections, but named for
  // this screen's own .m-section* contract (hub-m-today.html) — closed by
  // default, top section open. Tasks starts collapsed since Sessions is the
  // reason a trainer opens this screen.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ tasks: true });

  const dayEntries = useMemo(
    () =>
      entries
        .filter((e) => isoToLocalDate(e.scheduledAt) === day)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [entries, day],
  );

  const conflictIds = useMemo(() => findConflictIds(dayEntries), [dayEntries]);
  const clashCount = conflictIds.size;
  const isToday = day === todayISO();

  const dayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!currentUserName || t.assignee !== currentUserName) return false;
      if (!t.due_date) return false;
      if (t.due_date > day) return false;
      return t.status !== "done" || t.due_date === day;
    });
  }, [tasks, day, currentUserName]);

  const openTaskCount = dayTasks.filter((t) => t.status !== "done").length;

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    setTaskBusy((prev) => new Set(prev).add(taskId));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setTaskBusy((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }

  function goToday() {
    setDay(todayISO());
    setSheetOpen(false);
  }

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <div className="mbrand">
            <img src="/images/ef-heart-logo.svg" alt="Eternal Fitness" />
            <span className="mbrand-sub">Trainer Hub</span>
          </div>
          <DesktopLink
            className="desktop-link"
            href="/hub"
          >
            {ICO.monitor}
            Desktop site
          </DesktopLink>
        </div>
        <div className="daynav">
          <button className="daynav-btn" onClick={() => setDay(shiftDay(day, -1))} aria-label="Previous day">
            {ICO.left}
          </button>
          <button className="daynav-mid" onClick={() => setSheetOpen(!sheetOpen)} aria-label="Jump to a date">
            <span className="daynav-t">{headingFor(day)}</span>
            <span className="daynav-s">{subFor(day)}</span>
          </button>
          <button className="daynav-btn" onClick={() => setDay(shiftDay(day, 1))} aria-label="Next day">
            {ICO.right}
          </button>
        </div>
        <div className={`datesheet${sheetOpen ? " open" : ""}`}>
          <input
            type="date"
            value={day}
            onChange={(e) => {
              if (e.target.value) { setDay(e.target.value); setSheetOpen(false); }
            }}
            aria-label="Jump to date"
          />
          <button className="btn btn-outline" onClick={goToday}>Today</button>
        </div>
      </header>

      <main className="mcontent">
        {/* BUG-EF-135 — Resume session banner */}
        {resumeSession && (
          <Link
            className="alert a-info"
            href={`/hub/m/train/${resumeSession.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span className="alert-ic">{ICO.live}</span>
            <div>
              <b>Resume session</b>
              {resumeSession.clientName} — {resumeSession.displayName} is in progress.
            </div>
            <span className="schev">{ICO.chev}</span>
          </Link>
        )}

        {clashCount > 0 && (
          <div className="alert a-warning">
            <span className="alert-ic">{ICO.warn}</span>
            <div>
              <b>{clashCount} overlapping booking{clashCount !== 1 ? "s" : ""}</b>
              Two different clients are booked over each other. Nothing is blocked — check the times before you start.
            </div>
          </div>
        )}


        <div className={`m-section${collapsed.sessions ? " collapsed" : ""}`}>
          <button
            type="button"
            className="m-section-h"
            onClick={() => setCollapsed((p) => ({ ...p, sessions: !p.sessions }))}
            aria-expanded={!collapsed.sessions}
          >
            <div className="sec-h-ic ic-rose">{ICO.calSm}</div>
            <div>
              <div className="sec-h-t">Sessions</div>
              <div className="sec-h-s">{dayEntries.length === 0 ? "Nothing booked" : `${dayEntries.length} ${dayEntries.length === 1 ? "session" : "sessions"}`}</div>
            </div>
            <span className="m-section-chev">{ICO.chev}</span>
          </button>

          {!collapsed.sessions && (
            <div className="m-section-b">
              {dayEntries.length === 0 ? (
                <div className="empty">
                  <div className="empty-ic">{ICO.cal}</div>
                  <p className="empty-t">Nothing booked {isToday ? "today" : "this day"}</p>
                  <p className="empty-d">No sessions scheduled. Bookings are made on the desktop hub — this screen is for delivering them.</p>
                  <button className="btn btn-outline" onClick={goToday}>Back to today</button>
                </div>
              ) : (
                <div className="slist">
                  {(() => {
                    /* Find the first upcoming session (not completed, not cancelled, not past) */
                    const now = Date.now();
                    const nextIdx = dayEntries.findIndex((e) => {
                      if (e.status === "completed" || e.completedAt || e.sessionLogCompletedAt) return false;
                      if (e.status === "cancelled") return false;
                      const end = new Date(e.scheduledAt).getTime() + e.durationMinutes * 60_000;
                      return now <= end;
                    });

                    return dayEntries.map((entry, idx) => {
                      const clash = conflictIds.has(entry.id);
                      const { start, end } = formatTimeRange(entry.scheduledAt, entry.durationMinutes);
                      const hasMedicalFlag = entry.complianceStatus && entry.complianceStatus !== "clear";
                      const chip = deriveSessionChip(
                        entry.status ?? "planned",
                        entry.scheduledAt,
                        entry.durationMinutes,
                        entry.displayName,
                        {
                          sessionLogStartedAt: entry.sessionLogStartedAt,
                          sessionLogCompletedAt: entry.sessionLogCompletedAt,
                          completedAt: entry.completedAt,
                        },
                        idx === nextIdx,
                      );

                      return (
                        <Link
                          key={entry.id}
                          className={`scard${clash ? " clash" : ""}`}
                          href={`/hub/m/train/${entry.id}`}
                        >
                          <div className="stime">
                            <b>{start}</b>
                            <span>{end}</span>
                          </div>
                          <div className="sbody">
                            <div className="sname-row">
                              <span className="sname">{entry.clientName}</span>
                            </div>
                            <div className="smeta">
                              {entry.displayName}
                              {` · ${entry.durationMinutes} min`}
                            </div>
                            <div className="sflags">
                              <span className={`schip ${chip.variant}`}>{chip.label}</span>
                              {clash && <span className="pill clash-pill">{ICO.warnSm}Clash</span>}
                              {hasMedicalFlag && <span className="pill med">{ICO.med}Medical flag</span>}
                            </div>
                          </div>
                          <span className="schev">{ICO.chev}</span>
                        </Link>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {dayTasks.length > 0 && (
          <div className={`m-section${collapsed.tasks ? " collapsed" : ""}`}>
            <button
              type="button"
              className="m-section-h"
              onClick={() => setCollapsed((p) => ({ ...p, tasks: !p.tasks }))}
              aria-expanded={!collapsed.tasks}
            >
              <div className="sec-h-ic ic-teal">{ICO.checkSm}</div>
              <div>
                <div className="sec-h-t">Tasks due</div>
                <div className="sec-h-s">{openTaskCount} open</div>
              </div>
              <span className="m-section-chev">{ICO.chev}</span>
            </button>

            {!collapsed.tasks && (
              <div className="m-section-b">
                <div className="tlist">
                  {dayTasks.map((task) => {
                    const isDone = task.status === "done";
                    const due = task.due_date ? dueLabel(task.due_date, day) : null;
                    const busy = taskBusy.has(task.id);
                    return (
                      <div key={task.id} className={`trow${isDone ? " is-done" : ""}`}>
                        <button
                          className="tcheck"
                          onClick={() => toggleTask(task.id, task.status)}
                          disabled={busy}
                          aria-label={isDone ? "Mark task undone" : "Mark task done"}
                          aria-pressed={isDone}
                        >
                          {ICO.check}
                        </button>
                        <div className="tbody">
                          <div className="ttitle">{task.title}</div>
                          <div className="tmeta">
                            {task.client_name ? `${task.client_name} · ` : ""}
                            Studio admin
                          </div>
                        </div>
                        {due && <span className={`tdue ${due.cls}`}>{due.text}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
