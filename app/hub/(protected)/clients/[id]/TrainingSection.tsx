"use client";

import { useState, useEffect, useCallback } from "react";
import { useDrawerManager } from "./DrawerManager";
import { HubCard } from "@/components/hub";
import { deriveSessionPot } from "@/lib/session-pot";
import { sessionWorkoutName, isOutlookPlaceholder, isTrainerizeImported } from "@/lib/session-display";
import type { DBBlock, DBSession } from "@/types";
import type { QueueState } from "@/lib/programs/types";

/* ── TrainingSection — unified training model on the client record.
   Replaces the dated-block TrainingSummary with: Pot (sessions left) +
   Queue (ordered, undated workouts) + Booked in (calendar, the only
   dated object) + So far (history). Depth goes sideways into drawers.

   Populated state: duo pair (Sessions left + Next workout), queue rows,
   bookings, stats + history.
   Empty state: pot at full size (red when low), one sentence + two
   actions, no rotation strip, no date range, no "No workout assigned
   yet" rows. Shorter than the populated state. */

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function fmtDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysFromNow(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeDay(iso: string): string {
  const days = daysFromNow(iso);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 0 && days <= 7) return `In ${days} days`;
  return fmtDateFull(iso);
}

interface TrainingSectionProps {
  clientNumber: number;
  clientName: string;
  preferredTime: string | null;
  latestBlock: DBBlock | null;
  blockSessions: DBSession[];
  allBlocks: DBBlock[];
  allSessions: DBSession[];
  sessionsRemaining: number | null;
  sessionsPurchased: number | null;
  baselineUsed: number;
  paymentStatus: string | null;
  packageType: string | null;
  programState: QueueState | null;
  flaggedSessionIds: Set<string>;
  clientId: string;
  exerciseTrendSummary?: {
    totalExercisesLogged: number;
    personalBests: number;
    heaviestLift: string | null;
    belowBestCount: number;
    recentNotes: string | null;
  };
}

export function TrainingSection({
  clientNumber,
  clientName,
  preferredTime,
  latestBlock,
  blockSessions,
  allBlocks,
  allSessions,
  sessionsRemaining: sessionsRemainingRaw,
  sessionsPurchased,
  baselineUsed,
  paymentStatus,
  packageType,
  programState,
  flaggedSessionIds,
  clientId,
  exerciseTrendSummary,
}: TrainingSectionProps) {
  const { openDrawer, openWorkoutDrawer } = useDrawerManager();

  // ── Session pot derivation (BUG-EF-142 — baseline is mandatory) ──
  const isOngoing = !sessionsPurchased || packageType === "ongoing";
  const potSessions = allSessions.filter((s) => !s.parent_session_id);
  const pot = deriveSessionPot(potSessions, sessionsPurchased ?? null, baselineUsed);
  const remaining = pot.remaining ?? 0;
  const purchased = pot.purchased;
  const used = pot.used;

  // ── Queue derivation ──
  // If there's a program, use the program queue slots.
  // Otherwise, fall back to block sessions as the "queue".
  const queueFromProgram = programState
    ? programState.slots.map((slot, i) => ({
        position: i + 1,
        label: slotLabel(slot),
        subtitle: `${(slot.data?.sections?.length ?? 0)} section${(slot.data?.sections?.length ?? 0) === 1 ? "" : "s"}`,
        isCompleted: i < programState.completedCount,
        isNext: i === programState.completedCount,
      }))
    : null;

  // Fallback: derive queue from block sessions (undated).
  // Rule: queue = ordered list of WORKOUTS only. Exclude:
  //   - sub-sessions (parent_session_id set)
  //   - cancelled sessions (cancelled_at set) — neither queued nor completed
  //   - Outlook placeholders / empty bookings — calendar objects, not workouts
  const queueFromBlock = !queueFromProgram && latestBlock
    ? (() => {
        const workouts = blockSessions
          .filter(
            (s) =>
              !s.parent_session_id &&
              !s.cancelled_at &&
              !isOutlookPlaceholder(s) &&
              !isTrainerizeImported(s),
          )
          .sort((a, b) => (a.session_number ?? 0) - (b.session_number ?? 0));

        let completedSeen = 0;
        const firstPendingIdx = workouts.findIndex((w) => !w.completed_at);
        return workouts.map((s) => {
          const isCompleted = !!s.completed_at;
          if (isCompleted) completedSeen++;
          return {
            position: isCompleted ? completedSeen : completedSeen + 1,
            label: sessionWorkoutName(s) || `Workout`,
            subtitle: s.completed_at
              ? `Completed ${fmtDateShort(s.completed_at)}`
              : s.scheduled_at
                ? `Scheduled ${fmtDateShort(s.scheduled_at)}`
                : undefined,
            isCompleted,
            isNext: !isCompleted && workouts.indexOf(s) === firstPendingIdx,
            sessionId: s.id,
            scheduledAt: s.scheduled_at,
          };
        });
      })()
    : null;

  const queue = queueFromProgram ?? queueFromBlock ?? [];
  const completedCount = queue.filter((q) => q.isCompleted).length;
  const pendingCount = queue.filter((q) => !q.isCompleted).length;
  const nextItem = queue.find((q) => q.isNext);
  const pendingQueueItems = queue.filter((q) => !q.isCompleted);

  // ── Scheduled bookings (the only dated objects) ──
  const now = Date.now();
  const upcomingBookings = blockSessions
    .filter(
      (s) =>
        !s.completed_at &&
        !s.parent_session_id &&
        s.scheduled_at &&
        new Date(s.scheduled_at).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() -
        new Date(b.scheduled_at!).getTime(),
    )
    .slice(0, 5);

  // ── Completed sessions count ──
  // "Sessions done" counts all sessions consumed from the pot: baseline
  // (pre-hub) + in-hub completions + charged cancellations. This matches
  // the pot row's "used" figure so the two never disagree.
  const sessionsDone = used;
  // Attendance = in-hub completions / total sessions done (baseline +
  // completions + charged). Omittable when no sessions have been consumed.
  const attendanceRate =
    sessionsDone > 0
      ? Math.round((pot.completed / sessionsDone) * 100)
      : null;

  // ── Pot history (from blocks) ──
  // BUG-EF-142: the current pot uses the same derived figures as the header
  // (pot.used / pot.remaining) so the SO FAR row can never disagree with it.
  // Previous pots keep their own block-level counts — the baseline only
  // applies to the current pot.
  const potHistory = allBlocks
    .slice()
    .sort((a, b) => b.block_number - a.block_number)
    .map((block, idx) => {
      const isCurrent = latestBlock?.id === block.id;

      if (isCurrent) {
        const total = sessionsPurchased ?? pot.totalInBlock;
        const done = used; // baselineUsed + in-hub completed + charged cancellations
        const remainingVal = remaining;
        return {
          position: allBlocks.length - idx,
          total,
          done,
          remaining: remainingVal,
          isCurrent: true,
          isFullyDone: done >= total && total > 0,
        };
      }

      const blockSess = allSessions.filter(
        (s) => s.block_id === block.id && !s.parent_session_id,
      );
      const done = blockSess.filter((s) => s.completed_at).length;
      const total = blockSess.length;
      return {
        position: allBlocks.length - idx,
        total,
        done,
        remaining: total - done,
        isCurrent: false,
        isFullyDone: done >= total && total > 0,
      };
    });

  // ── Section subtitle ──
  const queueSummary =
    queue.length > 0
      ? `${remaining} of ${purchased ?? "?"} sessions left · ${pendingCount} workout${pendingCount === 1 ? "" : "s"} queued`
      : isOngoing
        ? `Ongoing · no session cap`
        : `${remaining} of ${purchased ?? "?"} sessions left · no workouts queued`;

  // ── Low pot threshold (2 or fewer) ──
  const isLow = !isOngoing && remaining <= 2 && remaining > 0;
  const isEmpty = !isOngoing && remaining === 0;

  // ── Supplementary count (for the opener button) ──
  const [supplementaryCount, setSupplementaryCount] = useState(0);
  const fetchSupplementaryCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientNumber}/supplementary-workouts`);
      if (res.ok) {
        const data = await res.json();
        const rows = data.rows ?? [];
        const total = rows.reduce(
          (sum: number, r: { attached_and_logged: number; attached_not_logged: number }) =>
            sum + r.attached_and_logged + r.attached_not_logged,
          0,
        );
        setSupplementaryCount(total);
      }
    } catch { /* ignore */ }
  }, [clientNumber]);
  useEffect(() => { fetchSupplementaryCount(); }, [fetchSupplementaryCount]);

  return (
    <HubCard padded={false}>
      {/* ── Section header ── */}
      <div className="h-card-hd">
        <h2 className="t-section">Training</h2>
        <span className="t-meta">{queueSummary}</span>
        <div className="seg" role="group" aria-label="Training view">
          <button className="seg-btn on" type="button" aria-pressed="true">Queue</button>
          <button className="seg-btn" type="button" aria-pressed="false">Booked in</button>
          <button className="seg-btn" type="button" aria-pressed="false">So far</button>
        </div>
        <button
          onClick={(e) => openDrawer("dw-training", e.currentTarget)}
          className="btn btn-outline btn-sm"
        >
          Open training
        </button>
      </div>

      <div className="h-card-bd">
        {/* ── Duo: Sessions left + Next workout ── */}
        <div className="grid-2" style={{ marginBottom: 12 }}>
          {/* Sessions left panel */}
          <div>
            <p className="t-micro" style={{ margin: "0 0 8px" }}>Sessions left</p>
            {isOngoing ? (
              <div className="pot">
                <span className="pot-fig"><b>∞</b><span>left</span></span>
                <div className="pot-r">
                  <p className="pot-s">Ongoing package — no session cap.</p>
                </div>
              </div>
            ) : (
              <div className="pot">
                <span className="pot-fig">
                  <b style={isLow || isEmpty ? { color: "var(--status-danger)" } : undefined}>{remaining}</b>
                  <span>left</span>
                </span>
                <div className="pot-r">
                  <div className="pot-bar">
                    <i style={{
                      width: `${purchased ? ((purchased - remaining) / purchased) * 100 : 0}%`,
                      background: isLow || isEmpty ? "var(--status-danger)" : "var(--color-rose)",
                    }} />
                  </div>
                  <p className="pot-s">{used} of {purchased ?? "?"} used. Only a completed workout takes one — nothing expires.</p>
                </div>
              </div>
            )}
          </div>

          {/* Next workout panel */}
          <div>
            <p className="t-micro" style={{ margin: "0 0 8px" }}>Next workout</p>
            {nextItem ? (
              <>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--color-ink)", letterSpacing: "-.01em" }}>
                  #{nextItem.position} {nextItem.label}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--color-body)" }}>
                  {nextItem.subtitle ||
                    "It is next because the previous one was completed, not because a date arrived."}
                </p>
              </>
            ) : queue.length > 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted-text)", fontStyle: "italic" }}>
                All workouts completed
              </p>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>
                  No plan yet
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--color-body)" }}>
                  {clientName} has no workouts assigned. Build a queue from scratch, or pour in one of the shared plans.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Workout queue ── */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12, marginBottom: 6 }}>
          <p className="t-micro" style={{ margin: 0 }}>Workout queue</p>
          <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            {supplementaryCount > 0 && (
              <button
                onClick={(e) => openDrawer("dw-supplementary", e.currentTarget)}
                className="btn btn-ghost btn-sm"
              >
                Supplementary · {supplementaryCount}
              </button>
            )}
            {queue.length > 0 && (
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                className="btn btn-ghost btn-sm"
              >
                See all {queue.length}
              </button>
            )}
          </span>
        </div>

        {queue.length === 0 ? (
          /* ── Empty state: no workouts assigned ── */
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1px dashed var(--hub-field-border)", borderRadius: "var(--r-nested)", background: "var(--field-fill, #FDFDFE)", marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-ink)" }}>
                No workouts assigned yet
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--color-body)" }}>
                Nothing is queued for {clientName.split(" ")[0]}, so nothing is shown. Build a queue from scratch, or copy one of the shared plans into it.
              </p>
            </div>
            <div style={{ flexShrink: 0, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                className="btn btn-outline btn-sm"
              >
                Use a shared plan
              </button>
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                className="btn btn-primary btn-sm"
              >
                Build a queue
              </button>
            </div>
          </div>
        ) : (
          /* ── Populated queue rows ── */
          <>
            {/* Completed doorway row */}
            {completedCount > 0 && (
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "9px 16px", borderRadius: "var(--r-nested)", border: "1px dashed var(--hub-border)", background: "var(--field-fill, #FDFDFE)", fontFamily: "inherit", fontSize: 13, color: "var(--color-body)", textAlign: "left", cursor: "pointer", marginBottom: 6 }}
              >
                <span>
                  <b style={{ color: "var(--color-ink)", fontWeight: 600 }}>
                    #1 – #{completedCount} done
                  </b>{" "}
                  — the last was{" "}
                  {queue[completedCount - 1]?.label ?? "a workout"}
                  {queue[completedCount - 1]?.subtitle
                    ? `, ${queue[completedCount - 1].subtitle.toLowerCase()}`
                    : ""}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--color-rose)" }}>
                  See history ›
                </span>
              </button>
            )}

            {/* Pending queue rows */}
            {queue
              .filter((q) => !q.isCompleted)
              .slice(0, 4)
              .map((item) => (
                <button
                  key={item.position}
                  onClick={(e) => {
                    if ("sessionId" in item && item.sessionId) {
                      openWorkoutDrawer(item.sessionId as string, e.currentTarget);
                    } else {
                      openDrawer("dw-training", e.currentTarget);
                    }
                  }}
                  className={`qrow${item.isNext ? " is-next" : ""}`}
                >
                  <span className="qrow-p">
                    {item.position}
                  </span>
                  <span className="qrow-w">
                    {item.label}
                    {item.subtitle && (
                      <small>{item.subtitle}</small>
                    )}
                  </span>
                  {item.isNext && (
                    <span className="badge b-primary">Next</span>
                  )}
                </button>
              ))}

            {/* Overflow row */}
            {pendingCount > 4 && (
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                className="qrow"
              >
                <span className="qrow-p">
                  +{pendingCount - 4}
                </span>
                <span className="qrow-w" style={{ fontWeight: 400, color: "var(--color-body)" }}>
                  #{completedCount + 5} – #{queue.length} queued
                </span>
                <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--color-rose)" }}>
                  See all {queue.length} ›
                </span>
              </button>
            )}

            {/* Pager / reconciliation */}
            <div className="pager">
              <span className="pager-i">
                <b style={{ color: "var(--color-ink)", fontWeight: 600 }}>
                  {pendingCount} workout{pendingCount === 1 ? "" : "s"} queued ·{" "}
                  {remaining} session{remaining === 1 ? "" : "s"} left
                </b>
                {" — "}
                {pendingCount === remaining
                  ? "The plan and the pot agree — she runs out of both at the same time."
                  : pendingCount > remaining
                    ? `The extra ${pendingCount - remaining} will need a new pot.`
                    : pendingCount < remaining
                      ? `She has ${remaining - pendingCount} more session${remaining - pendingCount === 1 ? "" : "s"} than workouts.`
                      : ""}
              </span>
              <div className="pager-b">
                <button
                  onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                  className="btn btn-outline btn-sm"
                >
                  See all {queue.length}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Reconciliation for empty state */}
        {queue.length === 0 && !isOngoing && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "7px 12px", borderRadius: "var(--r-nested)", fontSize: 12, background: "var(--status-warning-bg)", border: "1px solid var(--status-warning-border)", color: "var(--status-warning-text)" }}>
            <span>
              <b style={{ fontWeight: 600 }}>
                0 workouts queued · {remaining} session
                {remaining === 1 ? "" : "s"} left.
              </b>{" "}
              {remaining > 0
                ? `She is booked in with nothing to do.`
                : "The pot is empty."}
            </span>
          </div>
        )}

        {/* ── Booked in ── */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12, marginBottom: 6 }}>
          <p className="t-micro" style={{ margin: 0 }}>Booked in</p>
          <span style={{ marginLeft: "auto" }}>
            <button className="btn btn-ghost btn-sm">
              Book a session
            </button>
          </span>
        </div>

        {upcomingBookings.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted-text)", padding: "8px 16px" }}>
            No upcoming bookings.
          </p>
        ) : (
          upcomingBookings.map((booking, idx) => {
            const scheduledDate = new Date(booking.scheduled_at!);
            const dayName = scheduledDate.toLocaleDateString("en-GB", {
              weekday: "short",
            });
            const dateStr = fmtDateShort(booking.scheduled_at!);
            const timeStr = scheduledDate.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const rel = relativeDay(booking.scheduled_at!);
            const queueItem = pendingQueueItems[idx];

            return (
              <div
                key={booking.id}
                className="qrow"
              >
                <span style={{ flex: "0 0 150px", fontWeight: 600, color: "var(--color-ink)", fontVariantNumeric: "tabular-nums", fontSize: 13.5 }}>
                  {dayName} {dateStr}, {timeStr}
                  <span style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--color-muted-text)" }}>
                    {rel}
                  </span>
                </span>
                <span className="qrow-w" style={{ fontWeight: 400, color: "var(--color-body)" }}>
                  {queueItem ? (
                    <>
                      Will use <b style={{ color: "var(--color-ink)", fontWeight: 600 }}>#{queueItem.position} {queueItem.label}</b>
                    </>
                  ) : (
                    <span style={{ color: "var(--color-muted-text)", fontStyle: "italic" }}>
                      Nothing queued to use
                    </span>
                  )}
                </span>
                <span style={{ flexShrink: 0 }}>
                  <button
                    onClick={(e) => openWorkoutDrawer(booking.id, e.currentTarget)}
                    className="btn btn-outline btn-sm"
                  >
                    {queueItem ? "Open session" : "Assign a workout"}
                  </button>
                </span>
              </div>
            );
          })
        )}

        {/* ── So far ── */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12, marginBottom: 6 }}>
          <p className="t-micro" style={{ margin: 0 }}>So far</p>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "2px 12px", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "var(--color-body)" }}>
            <b style={{ display: "block", fontSize: 17, fontWeight: 800, color: "var(--color-ink)", letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums" }}>
              {sessionsDone}
            </b>
            sessions done
          </span>
          {attendanceRate !== null && (
            <span style={{ fontSize: 12, color: "var(--color-body)" }}>
              <b
                style={{
                  display: "block",
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: "-.01em",
                  fontVariantNumeric: "tabular-nums",
                  color: attendanceRate >= 90 ? "var(--status-success-text)" : "var(--color-ink)",
                }}
              >
                {attendanceRate}%
              </b>
              attendance
            </span>
          )}
          {exerciseTrendSummary && (
            <>
              {exerciseTrendSummary.personalBests > 0 && (
                <span style={{ fontSize: 12, color: "var(--color-body)" }}>
                  <b style={{ display: "block", fontSize: 17, fontWeight: 800, color: "var(--color-ink)", letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums" }}>
                    {exerciseTrendSummary.personalBests}
                  </b>
                  personal bests
                </span>
              )}
              {exerciseTrendSummary.heaviestLift && (
                <span style={{ fontSize: 12, color: "var(--color-body)" }}>
                  <b style={{ display: "block", fontSize: 17, fontWeight: 800, color: "var(--color-ink)", letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums" }}>
                    {exerciseTrendSummary.heaviestLift}
                  </b>
                  heaviest lift
                </span>
              )}
            </>
          )}
        </div>

        {/* Pot history rows */}
        {potHistory.map((pot) => (
          <button
            key={pot.position}
            onClick={(e) => openDrawer("dw-training", e.currentTarget)}
            className="qrow"
          >
            <span
              className="qrow-p"
              style={pot.isFullyDone ? {
                background: "var(--status-success-bg)",
                color: "var(--status-success-text)",
                borderColor: "var(--status-success-border)",
              } : undefined}
            >
              {pot.position}
            </span>
            <span className="qrow-w">
              Pot of {pot.total}
              <small>
                {pot.done} done · {pot.remaining} left
                {pot.isFullyDone ? " · fully used" : ""}
              </small>
            </span>
            <span style={{ flexShrink: 0 }}>
              {pot.isCurrent ? (
                <span className="badge b-primary">
                  Current
                </span>
              ) : (
                <span className="badge" style={{ background: "var(--status-neutral-bg)", border: "1px solid var(--status-neutral-border)", color: "var(--color-muted-text)" }}>
                  Finished
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </HubCard>
  );
}

/** Short display label for a program slot. */
function slotLabel(slot: { label?: string | null; position: number }): string {
  const label = slot.label?.trim();
  if (label) {
    const stripped = label.replace(/^(?:Workout|Warm[\s-]*up)\s+/i, "");
    const match = stripped.match(/^([A-Za-z0-9]+)/);
    if (match) {
      const prefix = /^workout\s/i.test(label) ? "W" : "";
      return prefix + match[1];
    }
    return stripped.slice(0, 3);
  }
  return String.fromCharCode(64 + slot.position);
}
