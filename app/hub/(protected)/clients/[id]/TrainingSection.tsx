"use client";

import { useDrawerManager } from "./DrawerManager";
import { deriveSessionPot } from "@/lib/session-pot";
import { sessionWorkoutName } from "@/lib/session-display";
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

  // Fallback: derive queue from block sessions (undated)
  const queueFromBlock = !queueFromProgram && latestBlock
    ? blockSessions
        .filter((s) => !s.parent_session_id)
        .sort((a, b) => (a.session_number ?? 0) - (b.session_number ?? 0))
        .map((s, i) => ({
          position: i + 1,
          label: sessionWorkoutName(s) || `Workout ${i + 1}`,
          subtitle: s.completed_at
            ? `Completed ${fmtDateShort(s.completed_at)}`
            : s.scheduled_at
              ? `Scheduled ${fmtDateShort(s.scheduled_at)}`
              : undefined,
          isCompleted: !!s.completed_at,
          isNext: !s.completed_at && !blockSessions.slice(0, i).some((ss) => !ss.completed_at),
          sessionId: s.id,
          scheduledAt: s.scheduled_at,
        }))
    : null;

  const queue = queueFromProgram ?? queueFromBlock ?? [];
  const completedCount = queue.filter((q) => q.isCompleted).length;
  const pendingCount = queue.filter((q) => !q.isCompleted).length;
  const nextItem = queue.find((q) => q.isNext);

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
  const totalCompleted = allSessions.filter(
    (s) => s.completed_at && !s.parent_session_id,
  ).length;
  const totalScheduled = allSessions.filter(
    (s) => s.scheduled_at && !s.parent_session_id,
  ).length;
  const attendanceRate =
    totalScheduled > 0
      ? Math.round((totalCompleted / totalScheduled) * 100)
      : 100;

  // ── Pot history (from blocks) ──
  const potHistory = allBlocks
    .slice()
    .sort((a, b) => b.block_number - a.block_number)
    .map((block, idx) => {
      const blockSess = allSessions.filter(
        (s) => s.block_id === block.id && !s.parent_session_id,
      );
      const done = blockSess.filter((s) => s.completed_at).length;
      const isCurrent = latestBlock?.id === block.id;
      const total = isCurrent ? (sessionsPurchased ?? blockSess.length) : blockSess.length;
      return {
        position: allBlocks.length - idx,
        total,
        done,
        remaining: total - done,
        isCurrent,
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

  return (
    <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden">
      {/* ── Section header ── */}
      <div className="flex items-center gap-2.5 py-2.5 px-4">
        <h2 className="m-0 text-[15px] font-bold text-ink tracking-tight">
          Training
        </h2>
        <span className="text-xs text-[var(--color-muted-text)]">{queueSummary}</span>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={(e) => openDrawer("dw-training", e.currentTarget)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] font-[inherit] text-xs font-semibold cursor-pointer transition-colors"
          >
            Open training
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        {/* ── Duo: Sessions left + Next workout ── */}
        <div className="grid grid-cols-2 gap-2.5 mb-3 max-[1080px]:grid-cols-1">
          {/* Sessions left panel (rose) */}
          <div className="border border-[var(--hub-border)] rounded-nested bg-white overflow-hidden flex flex-col">
            <div className="flex items-baseline gap-2.5 py-[7px] px-3 border-b border-[var(--hub-border)] border-t-[3px] border-t-rose bg-[var(--status-primary-bg)]">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[var(--status-primary-text)]">
                Sessions left
              </span>
              <span className="ml-auto text-xs font-semibold text-[var(--color-body)] tabular-nums">
                {isOngoing
                  ? "Ongoing"
                  : `Pot of ${purchased ?? "?"}`}
              </span>
            </div>
            <div className="flex-1 py-2 px-3">
              {isOngoing ? (
                <div className="flex items-center gap-3.5">
                  <span className="text-[22px] font-bold text-ink leading-none">
                    ∞
                  </span>
                  <span className="text-xs text-[var(--color-body)]">
                    Ongoing package — no session cap
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3.5">
                  <span
                    className={`text-[34px] font-extrabold leading-none tracking-tight tabular-nums ${
                      isLow || isEmpty
                        ? "text-[var(--status-danger)]"
                        : "text-ink"
                    }`}
                  >
                    {remaining}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--color-body)]">
                      left
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-2 rounded-pill overflow-hidden bg-[var(--hub-hover)] border border-[var(--hub-border)]">
                      <div
                        className="h-full rounded-pill"
                        style={{
                          width: `${purchased ? ((purchased - remaining) / purchased) * 100 : 0}%`,
                          backgroundColor:
                            isLow || isEmpty
                              ? "var(--status-danger)"
                              : "var(--status-primary)",
                        }}
                      />
                    </div>
                    <p className="m-0 mt-1 text-[12.5px] text-[var(--color-body)]">
                      {used} used. Only a completed workout takes one —
                      reschedules and cancellations don&apos;t.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 py-[7px] px-2.5 border-t border-[var(--hub-border)] bg-[var(--field-fill)]">
              <span className="text-xs text-[var(--color-body)]">Nothing expires.</span>
              <button
                onClick={() => openDrawer("dw-pot-ledger")}
                className="ml-auto text-xs font-semibold text-rose hover:underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer font-[inherit]"
              >
                Session balance ›
              </button>
            </div>
          </div>

          {/* Next workout panel (teal) */}
          <div className="border border-[var(--hub-border)] rounded-nested bg-white overflow-hidden flex flex-col">
            <div className="flex items-baseline gap-2.5 py-[7px] px-3 border-b border-[var(--hub-border)] border-t-[3px] border-t-[var(--status-success)] bg-[var(--status-success-bg)]">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[var(--status-success-text)]">
                Next workout
              </span>
              <span className="ml-auto text-xs font-semibold text-[var(--color-body)] tabular-nums">
                {nextItem
                  ? `#${nextItem.position} in the queue`
                  : queue.length > 0
                    ? "All done"
                    : "Nothing queued"}
              </span>
            </div>
            <div className="flex-1 py-2 px-3">
              {nextItem ? (
                <>
                  <p className="m-0 text-[14.5px] font-bold text-ink tracking-tight">
                    {nextItem.label}
                  </p>
                  <p className="m-0 mt-0.5 text-xs text-[var(--color-body)]">
                    {nextItem.subtitle ||
                      "It is next because the previous one was completed, not because a date arrived."}
                  </p>
                </>
              ) : queue.length > 0 ? (
                <p className="m-0 text-[13px] text-[var(--color-muted-text)] italic">
                  All workouts completed
                </p>
              ) : (
                <>
                  <p className="m-0 text-[14px] font-bold text-ink">
                    No plan yet
                  </p>
                  <p className="m-0 mt-0.5 text-xs text-[var(--color-body)]">
                    {clientName} has no workouts assigned. Build a queue from
                    scratch, or pour in one of the shared plans.
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-1.5 py-[7px] px-2.5 border-t border-[var(--hub-border)] bg-[var(--field-fill)]">
              {nextItem ? (
                <button
                  onClick={(e) => {
                    if ("sessionId" in nextItem && nextItem.sessionId) {
                      openWorkoutDrawer(nextItem.sessionId as string, e.currentTarget);
                    } else {
                      openDrawer("dw-training", e.currentTarget);
                    }
                  }}
                  className="ml-auto text-xs font-semibold text-rose hover:underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer font-[inherit]"
                >
                  See the workout ›
                </button>
              ) : (
                <>
                  <span className="text-xs text-[var(--color-body)]">Takes about a minute.</span>
                  <button
                    onClick={(e) =>
                      openDrawer("dw-training", e.currentTarget)
                    }
                    className="ml-auto text-xs font-semibold text-rose hover:underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer font-[inherit]"
                  >
                    Build her queue ›
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Workout queue ── */}
        <div className="flex items-baseline gap-2.5 mt-3 mb-1.5">
          <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.09em] text-ink">
            Workout queue
          </h3>
          <p className="m-0 text-xs text-[var(--color-body)]">
            In order. One is used up each time a session is completed.
          </p>
          {queue.length > 0 && (
            <span className="ml-auto flex gap-1.5">
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                className="text-xs font-semibold text-[var(--color-muted-text)] hover:text-ink bg-transparent border-0 p-0 cursor-pointer font-[inherit]"
              >
                See all {queue.length}
              </button>
            </span>
          )}
        </div>

        {queue.length === 0 ? (
          /* ── Empty state: no workouts assigned ── */
          <div className="flex items-center gap-3.5 py-3.5 px-3.5 border border-dashed border-[var(--hub-field-border)] rounded-nested bg-[var(--field-fill)] mb-2">
            <div className="flex-1 min-w-0">
              <p className="m-0 text-sm font-bold text-ink">
                No workouts assigned yet
              </p>
              <p className="m-0 mt-0.5 text-xs text-[var(--color-body)]">
                Nothing is queued for {clientName.split(" ")[0]}, so nothing is
                shown. Build a queue from scratch, or copy one of the shared
                plans into it.
              </p>
            </div>
            <div className="shrink-0 flex gap-2 items-center flex-wrap justify-end">
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] font-[inherit] text-xs font-semibold cursor-pointer transition-colors"
              >
                Use a shared plan
              </button>
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                className="inline-flex items-center justify-center gap-1.5 rounded-control bg-rose text-white font-[inherit] text-xs font-semibold cursor-pointer px-3.5 py-1.5 hover:bg-[color-mix(in_oklab,var(--rose)_88%,var(--ink))] transition-colors"
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
                className="flex items-center gap-3 w-full py-2 px-3 rounded-nested border border-dashed border-[var(--hub-border)] bg-[var(--field-fill)] font-[inherit] text-[13px] text-[var(--color-body)] text-left cursor-pointer mb-1.5 hover:bg-[var(--hub-hover)] hover:border-solid transition-colors"
              >
                <span>
                  <b className="text-ink font-semibold">
                    #1 – #{completedCount} done
                  </b>{" "}
                  — the last was{" "}
                  {queue[completedCount - 1]?.label ?? "a workout"}
                  {queue[completedCount - 1]?.subtitle
                    ? `, ${queue[completedCount - 1].subtitle.toLowerCase()}`
                    : ""}
                </span>
                <span className="ml-auto text-xs font-semibold text-rose">
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
                  className={`flex items-center gap-3 w-full py-2 px-3 rounded-nested border transition-colors font-[inherit] text-left cursor-pointer mb-0.5 ${
                    item.isNext
                      ? "bg-[var(--status-primary-bg)] border-[var(--status-primary-border)]"
                      : "border-transparent hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)]"
                  }`}
                >
                  <span
                    className={`flex-0-0 w-10 h-7 rounded-control-sm border grid place-items-center text-xs font-extrabold tabular-nums ${
                      item.isNext
                        ? "bg-white border-rose text-[var(--status-primary-text)]"
                        : "bg-[var(--field-fill)] border-[var(--hub-border)] text-[var(--color-body)]"
                    }`}
                  >
                    {item.position}
                  </span>
                  <span className="flex-1 min-w-0 text-[13.5px] font-medium text-ink">
                    {item.label}
                    {item.subtitle && (
                      <span className="block text-xs font-normal text-[var(--color-muted-text)] mt-px">
                        {item.subtitle}
                      </span>
                    )}
                  </span>
                  {item.isNext && (
                    <span className="shrink-0 inline-flex items-center h-[21px] px-2.5 rounded-pill text-[11.5px] font-semibold border border-transparent bg-[var(--status-primary-bg)] text-[var(--status-primary-text)] border-[var(--status-primary-border)]">
                      Next
                    </span>
                  )}
                  <span className="shrink-0 text-xs font-semibold text-rose">
                    Open ›
                  </span>
                </button>
              ))}

            {/* Overflow row */}
            {pendingCount > 4 && (
              <button
                onClick={(e) => openDrawer("dw-training", e.currentTarget)}
                className="flex items-center gap-3 w-full py-2 px-3 rounded-nested border border-transparent hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)] font-[inherit] text-left cursor-pointer mb-0.5 transition-colors"
              >
                <span className="flex-0-0 w-10 h-7 rounded-control-sm border grid place-items-center text-xs font-extrabold tabular-nums bg-[var(--field-fill)] border-[var(--hub-border)] text-[var(--color-body)]">
                  +{pendingCount - 4}
                </span>
                <span className="flex-1 min-w-0 text-[13.5px] text-[var(--color-body)]">
                  #{completedCount + 5} – #{queue.length} queued
                </span>
                <span className="shrink-0 text-xs font-semibold text-rose">
                  See all {queue.length} ›
                </span>
              </button>
            )}

            {/* Reconciliation */}
            <div className="flex items-center gap-2 mt-2 py-[7px] px-3 rounded-nested text-xs bg-[var(--field-fill)] border border-[var(--hub-border)] text-[var(--color-body)]">
              <span>
                <b className="text-ink font-semibold">
                  {pendingCount} workout{pendingCount === 1 ? "" : "s"} queued ·{" "}
                  {remaining} session{remaining === 1 ? "" : "s"} left.
                </b>{" "}
                {pendingCount === remaining
                  ? "The plan and the pot agree — she runs out of both at the same time."
                  : pendingCount > remaining
                    ? `She has more workouts than sessions. The extra ${pendingCount - remaining} will need a new pot.`
                    : pendingCount < remaining
                      ? `She has ${remaining - pendingCount} more session${remaining - pendingCount === 1 ? "" : "s"} than workouts.`
                      : ""}
              </span>
            </div>
          </>
        )}

        {/* Reconciliation for empty state */}
        {queue.length === 0 && !isOngoing && (
          <div className="flex items-center gap-2 mt-2 py-[7px] px-3 rounded-nested text-xs border bg-[var(--status-warning-bg)] border-[var(--status-warning-border)] text-[var(--status-warning-text)]">
            <span>
              <b className="font-semibold">
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
        <div className="flex items-baseline gap-2.5 mt-3 mb-1.5">
          <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.09em] text-ink">
            Booked in
          </h3>
          <p className="m-0 text-xs text-[var(--color-body)]">
            The only dates here. A booking takes a session only once the
            workout is completed.
          </p>
          <span className="ml-auto">
            <button className="text-xs font-semibold text-[var(--color-muted-text)] hover:text-ink bg-transparent border-0 p-0 cursor-pointer font-[inherit]">
              Book a session
            </button>
          </span>
        </div>

        {upcomingBookings.length === 0 ? (
          <p className="m-0 text-xs text-[var(--color-muted-text)] py-2 px-3">
            No upcoming bookings.
          </p>
        ) : (
          upcomingBookings.map((booking) => {
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
            const workoutName = sessionWorkoutName(booking);

            return (
              <div
                key={booking.id}
                className="flex items-center gap-3 py-2 px-3 rounded-nested border border-transparent hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)] transition-colors"
              >
                <span className="flex-0-0 w-[150px] font-semibold text-ink tabular-nums text-[13.5px]">
                  {dayName} {dateStr}, {timeStr}
                  <span className="block text-[11.5px] font-medium text-[var(--color-muted-text)]">
                    {rel}
                  </span>
                </span>
                <span className="flex-1 min-w-0 text-xs text-[var(--color-body)]">
                  {workoutName ? (
                    <>
                      Will use <b className="text-ink font-semibold">{workoutName}</b>
                    </>
                  ) : (
                    <span className="text-[var(--color-muted-text)] italic">
                      Nothing queued to use
                    </span>
                  )}
                </span>
                <span className="shrink-0">
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] font-[inherit] text-xs font-semibold cursor-pointer transition-colors">
                    {workoutName ? "Open session" : "Assign a workout"}
                  </button>
                </span>
              </div>
            );
          })
        )}

        {/* ── So far ── */}
        <div className="flex items-baseline gap-2.5 mt-3 mb-1.5">
          <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.09em] text-ink">
            So far
          </h3>
          <p className="m-0 text-xs text-[var(--color-body)]">
            {potHistory.length === 1
              ? "One pot since she started."
              : `${potHistory.length} pots since she started.`}
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex gap-4 flex-wrap py-0.5 px-3 mb-1.5">
          <span className="text-xs text-[var(--color-body)]">
            <b className="block text-[17px] font-extrabold text-ink tracking-tight tabular-nums">
              {totalCompleted}
            </b>
            sessions done
          </span>
          <span className="text-xs text-[var(--color-body)]">
            <b
              className={`block text-[17px] font-extrabold tracking-tight tabular-nums ${
                attendanceRate >= 90
                  ? "text-[var(--status-success-text)]"
                  : "text-ink"
              }`}
            >
              {attendanceRate}%
            </b>
            attendance
          </span>
          {exerciseTrendSummary && (
            <>
              {exerciseTrendSummary.personalBests > 0 && (
                <span className="text-xs text-[var(--color-body)]">
                  <b className="block text-[17px] font-extrabold text-ink tracking-tight tabular-nums">
                    {exerciseTrendSummary.personalBests}
                  </b>
                  personal bests
                </span>
              )}
              {exerciseTrendSummary.heaviestLift && (
                <span className="text-xs text-[var(--color-body)]">
                  <b className="block text-[17px] font-extrabold text-ink tracking-tight tabular-nums">
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
            className="flex items-center gap-2.5 w-full py-[7px] px-2.5 border border-transparent rounded-nested font-[inherit] text-left cursor-pointer hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)] transition-colors"
          >
            <span
              className={`w-[26px] h-[26px] rounded-control-sm grid place-items-center text-[11px] font-extrabold ${
                pot.isFullyDone
                  ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]"
                  : "bg-[var(--neutral-bg)] text-navy"
              }`}
            >
              {pot.position}
            </span>
            <span className="flex-1 min-w-0 text-[13.5px] font-semibold text-ink">
              Pot of {pot.total}
              <span className="text-xs font-normal text-[var(--color-body)] ml-2">
                {pot.done} done · {pot.remaining} left
                {pot.isFullyDone ? " · fully used" : ""}
              </span>
            </span>
            <span className="shrink-0">
              {pot.isCurrent ? (
                <span className="inline-flex items-center h-[21px] px-2.5 rounded-pill text-[11.5px] font-semibold border border-transparent bg-[var(--status-primary-bg)] text-[var(--status-primary-text)] border-[var(--status-primary-border)]">
                  Current
                </span>
              ) : (
                <span className="inline-flex items-center h-[21px] px-2.5 rounded-pill text-[11.5px] font-semibold border border-transparent bg-neutral-bg text-[var(--color-muted-text)] border-neutral-border">
                  Finished
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs font-semibold text-rose">
              Open ›
            </span>
          </button>
        ))}
      </div>
    </div>
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
