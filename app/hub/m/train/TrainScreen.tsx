"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DesktopLink } from "@/components/hub/DesktopLink";
import { deriveSessionChip } from "@/lib/session-chip";
import type { TrainEntry } from "./page";

// ── date/time helpers ─────────────────────────────────────────

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

function headingFor(isoDate: string): string {
  const [y, mo, d] = isoDate.split("-").map(Number);
  if (isoDate === todayISO()) return "Today";
  if (isoDate === shiftDay(todayISO(), 1)) return "Tomorrow";
  return new Date(y, mo - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function shiftDay(isoDate: string, delta: number): string {
  const [y, mo, d] = isoDate.split("-").map(Number);
  const next = new Date(y, mo - 1, d);
  next.setDate(next.getDate() + delta);
  return toLocalISODate(next);
}

function formatTimeRange(iso: string, durationMinutes: number): { start: string; end: string } {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { start: fmt(start), end: fmt(end) };
}

function relativeTimeLabel(scheduledAt: string): string {
  const now = Date.now();
  const target = new Date(scheduledAt).getTime();
  const diffMs = target - now;
  const absDiff = Math.abs(diffMs);
  const mins = Math.round(absDiff / 60_000);

  if (diffMs > 0) {
    if (mins < 60) return `Starting in ${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `Starting in ${hrs}h ${remMins}m` : `Starting in ${hrs}h`;
  }
  // Past
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// ── icons ─────────────────────────────────────────────────────

const ICO = {
  monitor: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  dumbbell: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5v11M17.5 6.5v11M3 10h1.5M3 14h1.5M19.5 10H21M19.5 14H21M9 10h6v4H9z"/>
    </svg>
  ),
  chev: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  live: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6"/>
    </svg>
  ),
  calSm: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
};

// ── Main component ────────────────────────────────────────────

interface TrainScreenProps {
  entries: TrainEntry[];
}

function isCompleted(e: TrainEntry): boolean {
  return e.status === "completed" || !!e.completedAt || !!e.sessionLogCompletedAt;
}

function isInProgress(e: TrainEntry): boolean {
  return (e.status === "in_progress" || !!e.startedAt) && !isCompleted(e) && !e.lapseFlaggedAt;
}

export function TrainScreen({ entries }: TrainScreenProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Categorise sessions
  const todayDate = new Date();

  const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const todaySessions = useMemo(() =>
    entries
      .filter((e) => {
        const at = new Date(e.scheduledAt);
        return at >= todayStart && at < todayEnd;
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [entries, todayStart.getTime(), todayEnd.getTime()],
  );

  const upcomingSessions = useMemo(() =>
    entries
      .filter((e) => new Date(e.scheduledAt).getTime() >= todayEnd.getTime() && !isCompleted(e))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [entries, todayEnd.getTime()],
  );

  // Group upcoming by day
  const upcomingByDay = useMemo(() => {
    const groups = new Map<string, TrainEntry[]>();
    for (const e of upcomingSessions) {
      const day = isoToLocalDate(e.scheduledAt);
      const arr = groups.get(day) ?? [];
      arr.push(e);
      groups.set(day, arr);
    }
    return groups;
  }, [upcomingSessions]);

  // Find the first in-progress session for the resume banner
  const inProgress = todaySessions.find(isInProgress);

  // Find the "next" session (first upcoming that's not completed)
  const THIRTY_MIN = 30 * 60_000;
  const nextSession = useMemo(() => {
    const now = Date.now();
    // In-progress takes priority
    if (inProgress) return inProgress;
    // Next upcoming within 30 min
    const upcoming = todaySessions.find((e) => {
      if (isCompleted(e) || isInProgress(e)) return false;
      const startMs = new Date(e.scheduledAt).getTime();
      return startMs - now <= THIRTY_MIN;
    });
    return upcoming ?? null;
  }, [todaySessions, inProgress, THIRTY_MIN]);

  const hasTodaySessions = todaySessions.length > 0;
  const hasUpcoming = upcomingSessions.length > 0;

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <div className="mbrand">
            <img src="/images/ef-heart-logo.svg" alt="Eternal Fitness" />
            <span className="mbrand-sub">Trainer Hub</span>
          </div>
          <DesktopLink className="desktop-link" href="/hub">
            {ICO.monitor}
            Desktop site
          </DesktopLink>
        </div>
      </header>

      <main className="mcontent">
        {/* Resume banner — if a session is in progress, surface it */}
        {inProgress && (
          <Link
            className="alert a-info"
            href={`/hub/m/train/${inProgress.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span className="alert-ic">{ICO.live}</span>
            <div>
              <b>Resume session</b>
              {inProgress.clientName} — {inProgress.displayName} is in progress.
            </div>
            <span className="schev">{ICO.chev}</span>
          </Link>
        )}

        {/* Today's sessions */}
        <div className={`m-section${collapsed.today ? " collapsed" : ""}`}>
          <button
            type="button"
            className="m-section-h"
            onClick={() => setCollapsed((p) => ({ ...p, today: !p.today }))}
            aria-expanded={!collapsed.today}
          >
            <div className="sec-h-ic ic-rose">{ICO.calSm}</div>
            <div>
              <div className="sec-h-t">Today</div>
              <div className="sec-h-s">
                {todaySessions.length === 0
                  ? "Nothing booked"
                  : `${todaySessions.length} ${todaySessions.length === 1 ? "session" : "sessions"}`}
              </div>
            </div>
            <span className="m-section-chev">{ICO.chev}</span>
          </button>

          {!collapsed.today && (
            <div className="m-section-b">
              {todaySessions.length === 0 ? (
                <div className="empty">
                  <div className="empty-ic">{ICO.dumbbell}</div>
                  <p className="empty-t">Nothing booked today</p>
                  <p className="empty-d">No sessions scheduled for today.</p>
                </div>
              ) : (
                <div className="slist">
                  {todaySessions.map((entry) => {
                    const { start, end } = formatTimeRange(entry.scheduledAt, entry.durationMinutes);
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
                      entry === nextSession && !isInProgress(entry),
                    );
                    const hasMedicalFlag = entry.complianceStatus && entry.complianceStatus !== "clear";
                    const isDone = isCompleted(entry);

                    return (
                      <Link
                        key={entry.id}
                        className={`scard${isDone ? " done" : ""}`}
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
                            {` \u00B7 ${entry.durationMinutes} min`}
                          </div>
                          <div className="sflags">
                            <span className={`schip ${chip.variant}`}>{chip.label}</span>
                            {hasMedicalFlag && <span className="pill med">Medical flag</span>}
                            {entry === nextSession && !isInProgress(entry) && !isCompleted(entry) && (
                              <span className="pill live">{relativeTimeLabel(entry.scheduledAt)}</span>
                            )}
                          </div>
                        </div>
                        <span className="schev">{ICO.chev}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming sessions (future days) */}
        {hasUpcoming && (
          <div className={`m-section${collapsed.upcoming ? " collapsed" : ""}`}>
            <button
              type="button"
              className="m-section-h"
              onClick={() => setCollapsed((p) => ({ ...p, upcoming: !p.upcoming }))}
              aria-expanded={!collapsed.upcoming}
            >
              <div className="sec-h-ic ic-teal">{ICO.calSm}</div>
              <div>
                <div className="sec-h-t">Upcoming</div>
                <div className="sec-h-s">
                  {upcomingSessions.length} {upcomingSessions.length === 1 ? "session" : "sessions"} across {upcomingByDay.size} {upcomingByDay.size === 1 ? "day" : "days"}
                </div>
              </div>
              <span className="m-section-chev">{ICO.chev}</span>
            </button>

            {!collapsed.upcoming && (
              <div className="m-section-b">
                {[...upcomingByDay.entries()].map(([day, daySessions]) => (
                  <div key={day} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--muted)", marginBottom: 6, paddingLeft: 2 }}>
                      {headingFor(day)}
                    </div>
                    <div className="slist" style={{ marginBottom: 0 }}>
                      {daySessions.map((entry) => {
                        const { start, end } = formatTimeRange(entry.scheduledAt, entry.durationMinutes);
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
                        );
                        const hasMedicalFlag = entry.complianceStatus && entry.complianceStatus !== "clear";

                        return (
                          <Link
                            key={entry.id}
                            className="scard"
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
                                {` \u00B7 ${entry.durationMinutes} min`}
                              </div>
                              <div className="sflags">
                                <span className={`schip ${chip.variant}`}>{chip.label}</span>
                                {hasMedicalFlag && <span className="pill med">Medical flag</span>}
                              </div>
                            </div>
                            <span className="schev">{ICO.chev}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state — no sessions at all */}
        {!hasTodaySessions && !hasUpcoming && (
          <div className="empty">
            <div className="empty-ic">{ICO.dumbbell}</div>
            <p className="empty-t">No sessions scheduled</p>
            <p className="empty-d">Sessions will appear here once they are booked on the desktop hub.</p>
          </div>
        )}
      </main>
    </>
  );
}
