"use client";


import { useDrawerManager } from "./DrawerManager";
import { HubCard } from "@/components/hub";
import { deriveSessionPot } from "@/lib/session-pot";
import { sessionWorkoutName, isOutlookPlaceholder, isTrainerizeImported } from "@/lib/session-display";
import type { DBBlock, DBSession } from "@/types";
import type { QueueState } from "@/lib/programs/types";

/* ── TrainingSection — the SEE rung on the client record (CR-EF-186 u1).
   Read-only glance card: programme name + position, booked dates with the
   workout applied to each, sessions left, one-line "so far" summary.
   Two doors out: Manage training (primary → dw-training) and Progress
   (→ dw-progress). No per-row controls, no segment toggle. */

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

function relativeDay(iso: string): string {
  const now = new Date();
  const target = new Date(iso);
  const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 0 && days <= 7) return `In ${days} days`;
  return fmtDateFull(iso);
}

function dayOfWeek(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short" });
}

function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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
  const { openDrawer } = useDrawerManager();

  // ── Session pot derivation (BUG-EF-142 — baseline is mandatory) ──
  const isOngoing = !sessionsPurchased || packageType === "ongoing";
  const potSessions = allSessions.filter((s) => !s.parent_session_id);
  const pot = deriveSessionPot(potSessions, sessionsPurchased ?? null, baselineUsed);
  const remaining = pot.remaining ?? 0;
  const purchased = pot.purchased;
  const used = pot.used;

  // ── Queue derivation (kept for data — presentation only changes) ──
  const queueFromProgram = programState
    ? programState.slots.map((slot, i) => ({
        position: i + 1,
        label: slotLabel(slot),
        subtitle: `${(slot.data?.sections?.length ?? 0)} section${(slot.data?.sections?.length ?? 0) === 1 ? "" : "s"}`,
        isCompleted: i < programState.completedCount,
        isNext: i === programState.completedCount,
      }))
    : null;

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
  const pendingCount = queue.filter((q) => !q.isCompleted).length;
  const nextItem = queue.find((q) => q.isNext);
  const completedCount = queue.filter((q) => q.isCompleted).length;

  // ── Scheduled bookings (the dated rows in SEE) ──
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
    );

  // ── Completed sessions count ──
  const sessionsDone = used;
  const attendanceRate =
    sessionsDone > 0
      ? Math.round((pot.completed / sessionsDone) * 100)
      : null;

  // ── Last logged date ──
  const lastCompleted = allSessions
    .filter((s) => s.completed_at && !s.parent_session_id)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

  // ── Programme name from program state, falling back to block title ──
  const programmeName = programState?.program?.name ?? latestBlock?.title ?? null;

  // ── Low pot threshold ──
  const isLow = !isOngoing && remaining <= 2 && remaining > 0;
  const isEmpty = !isOngoing && remaining === 0;

  // ── Match upcoming bookings to queue items for workout labels ──
  const pendingQueueItems = queue.filter((q) => !q.isCompleted);

  return (
    <HubCard padded={false}>
      {/* ── Card header ── */}
      <div className="h-card-hd">
        <h2 className="t-section">Training</h2>
        <span className="t-meta">Read-only. Everything you can change is behind Manage training.</span>
      </div>

      {/* ── Glance: programme + sessions left ── */}
      <div className="glance">
        <div>
          <p className="t-micro" style={{ margin: "0 0 8px" }}>Programme</p>
          {programmeName ? (
            <>
              <b className="g-prog">{programmeName}</b>
              <span className="g-prog-s">
                Position {nextItem?.position ?? completedCount + 1} of {queue.length || "?"}
                {nextItem ? (
                  <> · next up <b style={{ color: "var(--color-ink)" }}>{nextItem.label}</b></>
                ) : null}
              </span>
            </>
          ) : queue.length > 0 ? (
            <>
              <b className="g-prog">{clientName.split(" ")[0]}&apos;s programme</b>
              <span className="g-prog-s">
                Position {nextItem?.position ?? completedCount + 1} of {queue.length}
                {nextItem ? (
                  <> · next up <b style={{ color: "var(--color-ink)" }}>{nextItem.label}</b></>
                ) : null}
              </span>
            </>
          ) : (
            <>
              <b className="g-prog" style={{ color: "var(--color-muted)" }}>No programme yet</b>
              <span className="g-prog-s">Start one via Manage training.</span>
            </>
          )}
        </div>
        <div>
          <p className="t-micro" style={{ margin: "0 0 8px" }}>Sessions left</p>
          <div className="pot">
            {isOngoing ? (
              <>
                <span className="pot-fig"><b>∞</b><span>left</span></span>
                <span className="pot-r">
                  <p className="pot-s">Ongoing package — no session cap.</p>
                </span>
              </>
            ) : (
              <>
                <span className="pot-fig">
                  <b style={isLow || isEmpty ? { color: "var(--status-danger)" } : undefined}>{remaining}</b>
                  <span>left</span>
                </span>
                <span className="pot-r">
                  <span className="pot-bar">
                    <i style={{
                      width: `${purchased ? ((purchased - remaining) / purchased) * 100 : 0}%`,
                      background: isLow || isEmpty ? "var(--status-danger)" : "var(--color-rose)",
                    }} />
                  </span>
                  <span className="pot-s">{used} of {purchased ?? "?"} used. Only a completed workout takes one — nothing expires.</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Booked dates header row ── */}
      <div className="drow" style={{ background: "var(--hub-hover)" }}>
        <span className="drow-d t-micro" style={{ color: "var(--muted)" }}>Booked</span>
        <span className="drow-w t-micro" style={{ color: "var(--muted)" }}>Workout applied</span>
        <span className="drow-s t-micro" style={{ color: "var(--muted)" }}>State</span>
      </div>

      {/* ── Date rows — facts, not controls ── */}
      {upcomingBookings.length === 0 ? (
        <div className="drow" style={{ color: "var(--color-muted)", fontStyle: "italic", fontSize: 13 }}>
          <span className="drow-d">&nbsp;</span>
          <span className="drow-w">No upcoming bookings.</span>
          <span className="drow-s" />
        </div>
      ) : (
        upcomingBookings.map((booking, idx) => {
          const queueItem = pendingQueueItems[idx];
          return (
            <div key={booking.id} className="drow">
              <span className="drow-d">
                {dayOfWeek(booking.scheduled_at!)} {fmtDateShort(booking.scheduled_at!)}, {timeOfDay(booking.scheduled_at!)}
                <small>{relativeDay(booking.scheduled_at!)}</small>
              </span>
              <span className="drow-w">
                {queueItem ? (
                  <>
                    {queueItem.label}
                    <small>Position {queueItem.position}</small>
                  </>
                ) : (
                  <span className="drow-w none">
                    No workout applied yet
                    <small style={{ color: "var(--color-muted)", fontWeight: 400 }}>
                      Applied on the day, or ahead of time from Manage training
                    </small>
                  </span>
                )}
              </span>
              <span className="drow-s">
                {idx === 0 && queueItem?.isNext ? (
                  <span className="badge b-primary">Next</span>
                ) : queueItem ? (
                  <span className="badge b-neutral">Applied</span>
                ) : (
                  <span className="badge b-warning">Open</span>
                )}
              </span>
            </div>
          );
        })
      )}

      {/* ── So-far summary line ── */}
      <div className="drow" style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
        <span className="drow-d">&nbsp;</span>
        <span className="drow-w" style={{ fontSize: 12.5, color: "var(--color-muted)" }}>
          {sessionsDone} session{sessionsDone === 1 ? "" : "s"} completed
          {attendanceRate !== null && <> · {attendanceRate}% attendance</>}
          {lastCompleted?.completed_at && <> · last logged {fmtDateShort(lastCompleted.completed_at)}</>}
        </span>
        <span className="drow-s" />
      </div>

      {/* ── Rungs: the two doors out of SEE ── */}
      <div className="rungs">
        <button
          onClick={(e) => openDrawer("dw-training", e.currentTarget)}
          className="btn btn-primary"
          type="button"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Manage training
        </button>
        <button
          onClick={(e) => openDrawer("dw-progress", e.currentTarget)}
          className="btn btn-outline"
          type="button"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>
          Progress
        </button>
        <span className="spacer" />
        <span className="t-meta" style={{ alignSelf: "center" }}>Manage training applies workouts and programmes · Progress shows results and logs</span>
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
