"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BlockSchedulePanel } from "./BlockSchedulePanel";
import { BlockScheduler } from "./review/BlockScheduler";
import { EditBlockDrawer } from "./EditBlockDrawer";
import { AddWorkoutDialog } from "./AddWorkoutDialog";
import { CarryOverDialog } from "./CarryOverDialog";
import { SessionList } from "./SessionList";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { isoToLocalTime, shiftDay, derivedWeekLabel } from "@/lib/schedule-dates";
import { deriveSessionStatus } from "@/lib/session-status";
import { sessionWorkoutName } from "@/lib/session-display";
import type { Weekday } from "@/lib/scheduling";
import type { SessionStatus, DBSession, BlockStatus } from "@/types";
import type { QueueState } from "@/lib/programs/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconCheck } from "@/components/icons";

// ── Archetype descriptions for the block chip strip ──────────────
const ARCHETYPE_LABELS: Record<string, string> = {
  A: "Full body, day 1",
  B: "Full body, day 2",
  C: "Full body, day 3",
};

interface DisplaySession {
  id: string;
  session_number: number;
  archetype: string | null;
  week: number;
  phase: string;
  data: {
    focus_label?: string;
    session_log?: { completed_at?: string | null } | null;
    versions?: {
      studio?: { warm_up?: unknown[]; main_block?: unknown[]; cooldown?: unknown[] };
      home?: { warm_up?: unknown[]; main_block?: unknown[]; cooldown?: unknown[] };
    };
  };
  scheduled_at: string | null;
  projected_at?: string | null;
  status: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  cancel_reason: string | null;
  charged_free?: "charged" | "free" | null;
  parent_session_id?: string | null;
}

interface PreviousBlock {
  id: string;
  block_number: number;
  status: BlockStatus;
  scheduled_start: string | null;
  sessionCount: number;
  completedCount: number;
  dateRange: string;
  /**
   * CR-EF-153 — Esther's title if she set one, otherwise "Block N". Kept as
   * the ordinal fallback here (rather than the full name+span from
   * lib/block-name.ts) because this row already shows the precise dateRange
   * and sessionCount alongside it — a month-precision span too would just
   * repeat the same information less precisely.
   */
  displayName: string;
}

interface BlockOverviewClientProps {
  block: {
    id: string;
    block_number: number;
    block_note: string | null;
    summary: string | null;
    status: BlockStatus;
    title: string | null;
  };
  clientId: string;
  blockId: string;
  clientName: string;
  clientCondition: string | null;
  blockStatus: BlockStatus;
  approvedAt: string | null;
  blockDateSpanLabel: string;
  /** CR-EF-153 — computed via lib/block-name.ts, the single source of truth. */
  blockDisplayNameLabel: string;
  totalSessions: number;
  totalBlockCount: number;
  completedSessions: number;
  remainingCount: number;
  scheduledStartIso: string | null;
  weekdays: Weekday[];
  weeks: number[];
  sessions: DBSession[];
  displaySessions: DisplaySession[];
  chronologicalPositions: Map<string, { position: number; total: number }>;
  weekGroups: {
    key: string;
    kind: string;
    monday?: string;
    planWeek?: number;
    sessions: DisplaySession[];
  }[];
  /** Week group key that should start expanded — the first incomplete session's week. */
  targetWeekKey: string | null;
  previousBlocks: PreviousBlock[];
  archetypeTint: Record<string, string>;
  /** CR-EF-099 — session pot inputs for BlockPoolView. */
  sessionsPurchased: number | null;
  blockExpiryDate: string | null;
  blockExpiryExtensions: { from: string; to: string; at: string; reason?: string }[];
  programState: QueueState | null;
  clientNumber: number;
  sessionsRemaining: number | null;
  setCountsBySession?: Record<string, number>;
  pbCountsBySession?: Record<string, number>;
  /** CR-EF-165 — last-used dates keyed by normalised focus_label. */
  lastUsedMap?: Map<string, string | null>;
}

function sessionStatus(s: DisplaySession): SessionStatus {
  return deriveSessionStatus({
    status: s.status,
    cancelled_at: s.cancelled_at,
    scheduled_at: s.scheduled_at,
    completed_at: s.completed_at,
    session_log: s.data?.session_log,
  });
}

export function BlockOverviewClient({
  block,
  clientId,
  blockId,
  clientName,
  clientCondition,
  blockStatus,
  approvedAt: approvedAtInitial,
  blockDateSpanLabel,
  blockDisplayNameLabel,
  totalSessions,
  totalBlockCount,
  completedSessions,
  remainingCount,
  scheduledStartIso,
  weekdays,
  weeks,
  sessions,
  displaySessions,
  chronologicalPositions,
  weekGroups,
  targetWeekKey,
  previousBlocks,
  archetypeTint,
  sessionsPurchased,
  blockExpiryDate,
  blockExpiryExtensions,
  programState,
  clientNumber,
  sessionsRemaining,
  setCountsBySession,
  pbCountsBySession,
  lastUsedMap = new Map(),
}: BlockOverviewClientProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [carryOverOpen, setCarryOverOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [blockStatusState, setBlockStatusState] = useState<BlockStatus>(blockStatus);
  const [approvedAtState, setApprovedAtState] = useState<string | null>(approvedAtInitial);

  // ── Approve handler ──────────────────────────────────────────
  const doApprove = useCallback(async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/blocks/${blockId}/approve`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "Failed to approve");
        setApproving(false);
        return;
      }
      const now = new Date().toISOString();
      setBlockStatusState("approved");
      setApprovedAtState(now);
      setApproveOpen(false);
      const firstName = clientName.split(" ")[0];
      const firstSession = displaySessions.find(
        (s) => s.scheduled_at && sessionStatus(s) !== "completed" && sessionStatus(s) !== "cancelled",
      );
      if (firstSession?.scheduled_at) {
        const d = new Date(firstSession.scheduled_at);
        const dateLabel = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        const timeLabel = isoToLocalTime(firstSession.scheduled_at);
        toast.success(`Block ${block.block_number} approved. ${firstName}'s first session is ${dateLabel} at ${timeLabel}.`);
      } else {
        toast.success(`Block ${block.block_number} approved.`);
      }
      router.refresh();
    } catch {
      toast.error("Could not approve the block — check your connection and try again.");
    }
    setApproving(false);
  }, [blockId, block.block_number, clientName, displaySessions, router]);

  // ── Day label for session rows ───────────────────────────────
  const dayLabel = (s: DisplaySession): string => {
    if (s.scheduled_at) {
      const d = new Date(s.scheduled_at);
      return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    }
    const st = sessionStatus(s);
    if (st === "completed") {
      return s.completed_at
        ? `Completed ${new Date(s.completed_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`
        : "Completed — date unknown";
    }
    const pos = chronologicalPositions.get(s.id);
    return pos ? `Session ${pos.position} of ${pos.total}` : `Session ${s.session_number}`;
  };

  // ── Archetype chip strip ─────────────────────────────────────
  const archetypeCounts = new Map<string, number>();
  for (const s of displaySessions) {
    if (s.archetype) {
      archetypeCounts.set(s.archetype, (archetypeCounts.get(s.archetype) ?? 0) + 1);
    }
  }
  const archetypes = Array.from(archetypeCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const completedCount = displaySessions.filter((s) => sessionStatus(s) === "completed").length;

  // First incomplete session for the archetype chip strip "next up" marker
  const firstIncompleteProjected = displaySessions.find((s) => {
    const st = sessionStatus(s);
    return st !== "completed" && st !== "cancelled";
  });

  const blockDescriptor = clientCondition
    ? `Block ${block.block_number} of ${totalBlockCount} · ${clientCondition}`
    : `Block ${block.block_number} of ${totalBlockCount}`;

  // ── Week group labels (derived dates, never fabricated) ──────
  const formatShortDate = (iso: string): string =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  /** "24 Aug – 30 Aug" — the full Monday–Sunday span of a derived week. */
  const formatWeekRange = (monday: string): string => {
    const start = formatShortDate(monday);
    const end = formatShortDate(shiftDay(monday, 6));
    return start === end ? start : `${start} – ${end}`;
  };

  const approvedDateLabel = approvedAtState
    ? new Date(approvedAtState).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
              {blockDisplayNameLabel}
            </h1>
            <StatusBadge status={blockStatusState} />
          </div>
          <p className="text-[13px] text-[var(--body)] mt-0.5">
            {blockDescriptor}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {blockStatusState === "draft" && (
            <button
              type="button"
              onClick={() => setApproveOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-control bg-[var(--rose)] hover:bg-[color-mix(in_oklab,var(--rose)_88%,var(--ink))] text-white text-[13px] font-semibold transition-colors"
            >
              <IconCheck className="w-4 h-4" /> Review and approve
            </button>
          )}
          {blockStatusState === "approved" && approvedDateLabel && (
            <span className="text-sm font-medium text-[var(--muted)]">
              Approved · {approvedDateLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Block state section ─────────────────────────────────── */}
      <section
        className="bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden"
        style={{ marginBottom: "var(--d-section-gap, 14px)" }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3.5 border border-[var(--hub-border)] rounded-nested bg-[var(--field-fill,#FDFDFE)] p-3.5">
            <div className="w-[44px] h-[44px] rounded-control bg-[var(--s-primary-bg,rgba(193,131,159,.10))] text-[var(--rose-text,#94566F)] flex items-center justify-center text-[17px] font-extrabold shrink-0">
              {block.block_number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-[14.5px] font-bold text-[var(--color-ink)]">
                  {blockDisplayNameLabel}
                </strong>
                <StatusBadge status={blockStatusState} />
              </div>
              <p className="text-[12.5px] text-[var(--body)] mt-0.5">
                {totalSessions} sessions
                {weekdays.length > 0 && (
                  <> · {weekdays.map((w) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][w]).join(", & ")}</>
                )}
                {' · '}
                {blockDateSpanLabel}
                {block.block_number > 0 && totalBlockCount > 1 && (
                  <> · {totalBlockCount}-week band block</>
                )}
              </p>
              <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                {displaySessions.map((s, i) => {
                  const arch = s.archetype ?? "?";
                  const isFirstIncomplete = firstIncompleteProjected?.id === s.id;
                  return (
                    <span
                      key={s.id}
                      className={`w-[24px] h-[24px] rounded-control-sm flex items-center justify-center text-[11.5px] font-bold border ${
                        isFirstIncomplete
                          ? "bg-[var(--s-primary-bg)] text-[var(--rose-text)] border-[var(--rose)] shadow-[inset_0_0_0_1px_var(--rose)]"
                          : "bg-[var(--hub-card)] border-[var(--hub-border)] text-[var(--muted)]"
                      }`}
                    >
                      {arch}
                    </span>
                  );
                })}
                {firstIncompleteProjected && (
                  <span className="text-[11.5px] text-[var(--muted)] ml-1.5">
                    next up: {firstIncompleteProjected.archetype ?? "?"},{" "}
                    {firstIncompleteProjected.scheduled_at
                      ? new Date(firstIncompleteProjected.scheduled_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
                      : "not scheduled"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center h-[30px] px-2.5 rounded-control-sm border border-[var(--hub-border)] bg-[var(--hub-card)] text-[12.5px] font-medium text-[var(--color-ink)] hover:bg-[var(--hub-hover)] transition-colors"
              >
                Edit block
              </button>
              {/* The printable block plan existed but had no link anywhere in the
                  app. Found in the post-update route audit, 5 Sep 2026. */}
              <Link
                href={`/hub/clients/${clientId}/blocks/${blockId}/print`}
                className="inline-flex items-center h-[30px] px-2.5 rounded-control-sm border border-[var(--hub-border)] bg-[var(--hub-card)] text-[12.5px] font-medium text-[var(--color-ink)] no-underline hover:bg-[var(--hub-hover)] transition-colors"
              >
                Print
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sessions ──────────────────────────────────────────────
          CR-EF-032 / CR-EF-145: weeks are DERIVED from dates, never the
          stored `week` ordinal, and unbooked sessions carry a projected
          date so they group with the week they will fall in. */}
      <section
        className="bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden"
        style={{ marginBottom: "var(--d-section-gap, 14px)" }}
      >
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--hub-border)]">
          <h2 className="text-[15px] font-bold text-[var(--color-ink)]">Sessions</h2>
          <span className="text-[12.5px] text-[var(--muted)]">
            {totalSessions} · {completedCount} done
          </span>
        </div>
        <div className="p-3 space-y-2.5">
          {weekGroups.map((group) => {
            const isScheduled = group.kind === "scheduled";
            const isProjected = group.kind === "projected";
            const isPlanWeek = group.kind === "plan";
            const weekPotSessions = group.sessions.filter((s) => !s.parent_session_id);
            const done = weekPotSessions.filter((s) => sessionStatus(s) === "completed").length;
            const cancelled = weekPotSessions.filter((s) => sessionStatus(s) === "cancelled").length;
            const total = weekPotSessions.length;
            // BUG-EF-141 — null planWeek from Outlook-synced sessions without
            // a plan week ordinal. Do not render "null".
            const isNullWeek = isPlanWeek && (group.planWeek == null);
            const allCancelled = isPlanWeek && total > 0 && cancelled === total;

            const numLabel = (isScheduled || isProjected)
              ? String(Number(group.monday!.split("-")[2]))
              : isNullWeek
                ? "\u2014"
                : String(group.planWeek);
            const title = (isScheduled || isProjected)
              ? `Week of ${formatShortDate(group.monday!)}`
              : isNullWeek
                ? "Not scheduled"
                : `Week ${group.planWeek}`;
            const sub = (isScheduled || isProjected)
              ? isProjected
                ? `${total} projected · not yet booked`
                : formatWeekRange(group.monday!)
              : allCancelled
                ? `${cancelled} cancelled`
              // BUG-EF-115 — plan-week groups may hold completed sessions with
              // no date. Count them separately so the label stays truthful.
              : `${total} session${total === 1 ? "" : "s"} planned · no dates yet`;
            const progress = (isScheduled || isProjected)
              ? isProjected
                ? `${done} of ${total} booked${cancelled ? ` · ${cancelled} cancelled` : ""}`
                : `${done} of ${total} done${cancelled ? ` · ${cancelled} cancelled` : ""}`
              : allCancelled
                ? ""
              : done > 0
                ? `${done} completed${total - done > 0 ? ` · ${total - done} not yet booked` : ""}`
                : isNullWeek
                  ? ""
                  : "Not scheduled";

            return (
              <div key={group.key} className="rounded-nested border border-[var(--hub-border)] overflow-hidden">
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-[var(--hub-hover)]">
                  <span
                    className={`w-[26px] h-[26px] rounded-control-sm flex items-center justify-center text-[12px] font-extrabold shrink-0 ${
                      isScheduled
                        ? "bg-[var(--s-primary-bg,rgba(193,131,159,.10))] text-[var(--rose-text,#94566F)]"
                        : isProjected
                          ? "bg-[var(--s-warning-bg,#F7EFDD)] text-[var(--amber-text,#83672E)]"
                          : "bg-[var(--status-neutral-bg)] text-[var(--status-neutral)]"
                    }`}
                  >
                    {numLabel}
                  </span>
                  <span className="text-[13.5px] font-bold text-[var(--color-ink)]">{title}</span>
                  {sub && <span className="text-[12px] text-[var(--muted)]">{sub}</span>}
                  <span className="ml-auto text-[12px] text-[var(--muted)]">{progress}</span>
                </div>
                <div className="border-t border-[var(--hub-border)] bg-[var(--hub-card)]">
                  <SessionList
                    sessions={group.sessions}
                    totalSessions={totalSessions}
                    clientId={clientId}
                    blockId={blockId}
                    archetypeTint={archetypeTint}
                    chronologicalPositions={chronologicalPositions}
                    allSessions={sessions}
                    clientName={clientName}
                    sessionsPurchased={sessionsPurchased}
                    programState={programState}
                    clientNumber={clientNumber}
                    sessionsRemaining={sessionsRemaining}
                    setCountsBySession={setCountsBySession}
                    pbCountsBySession={pbCountsBySession}
                    lastUsedMap={lastUsedMap}
                  />
                </div>
              </div>
            );
          })}

          {weekGroups.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--muted)]">
              No sessions in this block yet.
            </div>
          )}
        </div>
      </section>

      {/* ── Review & approve (draft blocks only) ─────────────────
          CR-EF-136 u6 — exercise overview and scheduling folded from
          the old /review route into the block page per v3 mockup. */}
      {blockStatusState === "draft" && (
        <section
          className="bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden"
          style={{ marginBottom: "var(--d-section-gap, 14px)" }}
        >
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--hub-border)]">
            <h2 className="text-[15px] font-bold text-[var(--color-ink)]">Review &amp; approve</h2>
          </div>
          <div className="p-4 space-y-5">
            <BlockScheduler sessions={sessions} onChanged={() => router.refresh()} />

            <div>
              <h3 className="text-[13px] font-bold text-[var(--color-ink)] mb-2">Session overview</h3>
              <div className="overflow-x-auto rounded-nested border border-[var(--hub-border)]">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--hub-border)]">
                      <th className="text-left text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--hub-hover)] px-3 py-2">#</th>
                      <th className="text-left text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--hub-hover)] px-3 py-2">Type</th>
                      <th className="text-left text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--hub-hover)] px-3 py-2">Week</th>
                      <th className="text-left text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--hub-hover)] px-3 py-2">Phase</th>
                      <th className="text-left text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--hub-hover)] px-3 py-2">Exercises (Studio)</th>
                      <th className="text-left text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--hub-hover)] px-3 py-2">Exercises (Home)</th>
                      <th className="w-16 text-right text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--hub-hover)] px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => {
                      const studioCount =
                        (session.data?.versions?.studio?.warm_up?.length || 0) +
                        (session.data?.versions?.studio?.main_block?.length || 0) +
                        (session.data?.versions?.studio?.cooldown?.length || 0);
                      const homeCount =
                        (session.data?.versions?.home?.warm_up?.length || 0) +
                        (session.data?.versions?.home?.main_block?.length || 0) +
                        (session.data?.versions?.home?.cooldown?.length || 0);
                      return (
                        <tr
                          key={session.id}
                          className="border-b border-[var(--hub-border)] last:border-b-0 hover:bg-[var(--hub-hover)] transition-colors"
                        >
                          <td className="px-3 py-2 font-medium">{sessionWorkoutName(session, `Session ${session.session_number}`)}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-semibold ${
                              session.archetype === "A" ? "bg-[var(--s-success-bg)] text-[var(--teal-text)]" :
                              session.archetype === "B" ? "bg-[var(--s-primary-bg)] text-[var(--rose-text)]" :
                              "bg-[var(--s-neutral-bg)] text-[var(--s-neutral)]"
                            }`}>
                              {session.archetype}
                            </span>
                          </td>
                          <td className="px-3 py-2">{derivedWeekLabel(session.scheduled_at ?? null, session.week)}</td>
                          <td className="px-3 py-2 capitalize">{session.phase}</td>
                          <td className="px-3 py-2">{studioCount} exercises</td>
                          <td className="px-3 py-2">{homeCount} exercises</td>
                          <td className="px-3 py-2 text-right">
                            <Link
                              href={`/hub/clients/${clientId}/blocks/${blockId}/sessions/${session.session_number}${session.parent_session_id ? `?session=${session.id}` : ""}`}
                              className="text-[12.5px] font-semibold text-[var(--rose-text)] hover:underline underline-offset-2"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* ── Previous blocks ─────────────────────────────────────── */}
      {previousBlocks.length > 0 && (
        <section
          className="bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden"
          style={{ marginBottom: "var(--d-section-gap, 14px)" }}
        >
          <div className="px-4 py-2.5 border-b border-[var(--hub-border)]">
            <h2 className="text-[15px] font-bold text-[var(--color-ink)]">Previous blocks</h2>
          </div>
          <div>
            {previousBlocks.map((prevBlock) => (
              <div
                key={prevBlock.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--hub-hover)] transition-colors border-t border-[var(--hub-border)] first:border-t-0"
              >
                <span className="w-[7px] h-[7px] rounded-pill bg-[var(--s-success)] shrink-0" />
                <span className="flex-1 min-w-0 text-[13.5px] text-[var(--color-ink)] font-semibold">
                  {prevBlock.displayName}
                  <span className="font-normal text-[var(--body)] mx-2">·</span>
                  <span className="font-normal text-[var(--body)]">
                    {prevBlock.sessionCount} sessions · {prevBlock.dateRange} · {prevBlock.status}
                  </span>
                </span>
                <Link
                  href={`/hub/clients/${clientId}/blocks/${prevBlock.id}`}
                  className="shrink-0 text-[12.5px] font-semibold text-[var(--rose-text)] hover:underline underline-offset-[3px]"
                >
                  See sessions
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Existing drawers & dialogs ──────────────────────────── */}
      <BlockSchedulePanel
        blockId={blockId}
        sessionCount={totalSessions}
        scheduledStartIso={scheduledStartIso}
        weekdays={weekdays}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />

      <EditBlockDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        block={block}
        sessionCount={totalSessions}
        completedSessions={completedSessions}
        scheduledStartIso={scheduledStartIso}
      />
      <AddWorkoutDialog open={addWorkoutOpen} onOpenChange={setAddWorkoutOpen} blockId={blockId} weeks={weeks} />
      <CarryOverDialog
        open={carryOverOpen}
        onOpenChange={setCarryOverOpen}
        blockId={blockId}
        blockNumber={block.block_number}
        clientId={clientId}
        remainingCount={remainingCount}
      />

      {/* ── Approve dialog ──────────────────────────────────────── */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-[12px] shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-ink)]">
              Approve Block {block.block_number}?
            </DialogTitle>
            <DialogDescription>
              {clientName} · {totalSessions} sessions
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-[var(--color-ink)] leading-relaxed">
            <p className="font-semibold">
              {clientName.split(" ")[0]}&apos;s {totalSessions} sessions become live. You can still change any workout on the day.
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-[var(--body)]">
              <li>Nothing is sent to {clientName.split(" ")[0]} by approving — the portal shows the block as it is delivered.</li>
              <li>Approval is recorded with today&apos;s date.</li>
            </ul>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setApproveOpen(false)}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-card)] text-[13px] font-medium text-[var(--color-ink)] hover:bg-[var(--hub-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doApprove}
              disabled={approving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--rose)] hover:bg-[color-mix(in_oklab,var(--rose)_88%,var(--ink))] text-white text-[13px] font-semibold transition-colors disabled:opacity-50"
            >
              <IconCheck className="w-4 h-4" /> Approve block
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
