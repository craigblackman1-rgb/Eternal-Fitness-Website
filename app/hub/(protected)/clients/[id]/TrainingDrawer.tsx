"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DrawerShell } from "./DrawerManager";
import { SessionChooser } from "./SessionChooser";
import { SessionMoveDialog } from "./SessionMoveDialog";
import { sessionWorkoutName } from "@/lib/session-display";

import { SupplementaryWorkoutsCard } from "@/components/hub/SupplementaryWorkoutsCard";
import type { DBBlock, DBSession } from "@/types";
import type { QueueState } from "@/lib/programs/types";
import type {
  TrainerizeHistoryData,
  TrainerizePerformedWorkoutSummary,
  TrainerizePerformedExerciseDetail,
} from "@/components/hub";

/* ── TrainingDrawer — the workout queue drawer.
   The record owns every count and date; this drawer owns the full contents
   of the queue (including pre-app imported history) and the supplementary
   section. Standing rules stay on the page per Craig's override. ────── */

function fmtShortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function sourceLabel(source: string): string {
  switch (source) {
    case "message": return "Message";
    case "attention": return "Attention flag";
    case "program_instruction": return "Program note";
    case "workout_instruction": return "Workout note";
    default: return source;
  }
}

/** Collapsed row for a Trainerize-performed workout, expanding on click. */
function PerformedWorkoutRow({
  workout,
  clientNumber,
  isOpen,
  onToggle,
  detail,
}: {
  workout: TrainerizePerformedWorkoutSummary;
  clientNumber: number;
  isOpen: boolean;
  onToggle: () => void;
  detail: TrainerizePerformedExerciseDetail[] | "loading" | "error" | undefined;
}) {
  const exerciseCount = workout.exercises.length;
  return (
    <div>
      <button type="button" className="srow" style={{ paddingLeft: 30 }} onClick={onToggle}>
        <span className="srow-d" style={{ width: 18, fontSize: 12 }}>{isOpen ? "\u25be" : "\u25b8"}</span>
        <span className="srow-w">
          {workout.workoutName || "Workout"}
          <small>
            {fmtShortDate(workout.performedDate)} · {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""} · {workout.setCount} set{workout.setCount !== 1 ? "s" : ""}
          </small>
        </span>
      </button>
      {isOpen && (
        <div className="border border-[var(--hub-border)] rounded-nested bg-[var(--hub-hover)] mt-1 ml-[18px]">
          {detail === "loading" && <p className="text-[12.5px] text-[var(--color-muted)] px-2.5 py-2">Loading sets…</p>}
          {detail === "error" && <p className="text-[12.5px] text-[var(--color-muted)] px-2.5 py-2">Couldn't load this workout's sets.</p>}
          {Array.isArray(detail) && detail.length === 0 && (
            <p className="text-[12.5px] text-[var(--color-muted)] px-2.5 py-2">No sets recorded for this workout.</p>
          )}
          {Array.isArray(detail) && detail.map((ex, i) => {
            const reps = ex.sets.map((s) => s.reps).filter((r): r is number => r != null);
            const hasWeight = ex.sets.some((s) => s.weightKg != null);
            const weights = ex.sets.map((s) => s.weightKg).filter((w): w is number => w != null);
            const hasDuration = ex.sets.some((s) => s.durationSeconds != null);
            const durations = ex.sets.map((s) => s.durationSeconds).filter((d): d is number => d != null);
            const rpes = ex.sets.map((s) => s.rpe).filter((r): r is number => r != null);
            const nonPlaceholderRpes = rpes.filter((r) => r > 1);

            const unique = <T,>(arr: T[]) => arr.length > 0 && new Set(arr).size === 1;
            const range = (arr: number[]) =>
              unique(arr) ? String(arr[0]) : `${Math.min(...arr)}\u2013${Math.max(...arr)}`;

            const parts: string[] = [`${ex.sets.length} sets`];
            if (reps.length > 0) parts.push(`${range(reps)} reps`);
            else if (hasDuration) parts.push(unique(durations) ? `${durations[0]}s` : `${Math.min(...durations)}\u2013${Math.max(...durations)}s`);
            if (weights.length > 0) parts.push(`${range(weights)}kg`);
            if (nonPlaceholderRpes.length > 0) parts.push(`RPE ${range(nonPlaceholderRpes)}`);

            return (
              <div key={i} className={`flex items-baseline gap-1.5 px-2.5 py-1.5 ${i < detail.length - 1 ? "border-b border-[var(--hub-border)]" : ""}`}>
                <span className="text-[12.5px] font-semibold text-[var(--color-ink)] shrink-0">{ex.name}</span>
                <span className="text-[12px] text-[var(--color-muted)]">{parts.join(" \u00b7 ")}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

interface TrainingDrawerProps {
  clientNumber: number;
  clientName: string;
  latestBlock: DBBlock | null;
  blockSessions: DBSession[];
  allBlocks: DBBlock[];
  allSessions: DBSession[];
  trainerizeHistory: TrainerizeHistoryData;
  standingRules?: { id: string; label: string | null; detail: string }[];
  sessionsRemaining: number | null;
  sessionsPurchased: number | null;
  paymentStatus: string | null;
  packageType: string | null;
  programState: QueueState | null;
  flaggedSessionIds: Set<string>;
  activeProgramId: string | null;
  clientId: string;
}

export function TrainingDrawer({
  clientNumber,
  clientName,
  latestBlock,
  blockSessions,
  allBlocks,
  allSessions,
  trainerizeHistory,
  standingRules = [],
  sessionsRemaining,
  sessionsPurchased,
  paymentStatus,
  packageType,
  programState,
  flaggedSessionIds,
  activeProgramId,
  clientId,
}: TrainingDrawerProps) {
  const router = useRouter();

  // ── Dialog state ──
  const [chooserSessionId, setChooserSessionId] = useState<string | null>(null);
  const [chooserBusy, setChooserBusy] = useState(false);
  const [moveSession, setMoveSession] = useState<DBSession | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  // ── Paid-pot computation ──
  const isOngoing = !sessionsPurchased || packageType === "ongoing";
  const totalSessions = isOngoing ? null : sessionsPurchased;
  const remaining = sessionsRemaining ?? 0;

  // ── Program queue derivation ──
  const slots = programState?.slots ?? [];
  const totalQueueSlots = programState?.totalSlots ?? 0;
  const completedCount = programState?.completedCount ?? 0;
  const slotCount = slots.length;

  // Scheduled sessions by queue position (for the queue list display)
  const scheduledByPosition: Record<number, { scheduledAt: string | null }> = {};
  const programSessions = blockSessions.filter(
    (s) => s.program_id && s.program_slot_id && !s.parent_session_id
  );

  // Completed program-consuming sessions (ascending by completed_at) for queue position dates.
  const completedAscending = blockSessions
    .filter((s) => s.completed_at && !s.cancelled_at && !s.parent_session_id && !isRepeat((s.data as unknown as Record<string, unknown>)?.program_repeat))
    .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());
  for (let i = 0; i < completedAscending.length && i < completedCount; i++) {
    const s = completedAscending[i];
    scheduledByPosition[i + 1] = { scheduledAt: s.scheduled_at ?? s.completed_at };
  }
  const scheduledSessions = blockSessions
    .filter((s) => s.scheduled_at && !s.completed_at && !s.cancelled_at && !s.parent_session_id)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
  for (let i = 0; i < scheduledSessions.length; i++) {
    const s = scheduledSessions[i];
    const slot = s.program_slot_id ? slots.find((sl) => sl.id === s.program_slot_id) : null;
    if (slot && s.week) {
      const pos = (s.week - 1) * slotCount + slot.position;
      if (pos > 0 && pos <= totalQueueSlots) {
        scheduledByPosition[pos] = { scheduledAt: s.scheduled_at };
        continue;
      }
    }
    const pos = completedCount + i + 1;
    if (pos > totalQueueSlots) break;
    scheduledByPosition[pos] = { scheduledAt: s.scheduled_at };
  }

  // Trainerize history summary
  const tBlocks = trainerizeHistory.blocks ?? [];
  const unmatched = trainerizeHistory.unmatchedPerformedWorkouts ?? [];
  const notes = trainerizeHistory.notes ?? [];
  const tzTotalSessions = tBlocks.reduce(
    (sum: number, b: any) => sum + (b.performedWorkouts?.length ?? 0), 0
  ) + unmatched.length;
  const hasHistory = tBlocks.length > 0 || unmatched.length > 0 || notes.length > 0;

  const allDates: string[] = [];
  for (const b of tBlocks) {
    if (b.start_date) allDates.push(b.start_date);
    if (b.end_date) allDates.push(b.end_date);
  }
  for (const w of unmatched) if (w.performedDate) allDates.push(w.performedDate);
  const sortedDates = allDates.sort();
  const periodStart = sortedDates.length > 0 ? sortedDates[0] : null;
  const periodEnd = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, TrainerizePerformedExerciseDetail[] | "loading" | "error">>({});

  const toggleWorkout = (workoutId: string) => {
    if (expandedWorkoutId === workoutId) {
      setExpandedWorkoutId(null);
      return;
    }
    setExpandedWorkoutId(workoutId);
    if (detailCache[workoutId]) return;
    setDetailCache((c) => ({ ...c, [workoutId]: "loading" }));
    fetch(`/api/clients/${clientNumber}/trainerize-workout/${workoutId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((json) => setDetailCache((c) => ({ ...c, [workoutId]: json.exercises ?? [] })))
      .catch(() => setDetailCache((c) => ({ ...c, [workoutId]: "error" })));
  };

  const renderPerformedList = (workouts: TrainerizePerformedWorkoutSummary[]) =>
    workouts.map((w) => (
      <PerformedWorkoutRow
        key={w.id}
        workout={w}
        clientNumber={clientNumber}
        isOpen={expandedWorkoutId === w.id}
        onToggle={() => toggleWorkout(w.id)}
        detail={detailCache[w.id]}
      />
    ));

  // ── Reassign handler ──
  async function handleReassignProgram(sessionId: string, slotId: string) {
    setChooserBusy(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: programState?.program.id ?? null,
          program_slot_id: slotId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reassign");
      }
      toast.success("Session reassigned to program slot");
      setChooserSessionId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reassign");
    } finally {
      setChooserBusy(false);
    }
  }

  async function handleReassignTemplate(sessionId: string, templateId: string, templateName: string) {
    setChooserBusy(true);
    try {
      const tplRes = await fetch("/api/workout-templates");
      if (!tplRes.ok) throw new Error("Could not load template data");
      const tplList: { id: string; name: string; data: SessionVersion }[] = await tplRes.json();
      const tpl = tplList.find((t) => t.id === templateId);
      if (!tpl) throw new Error("Template not found");

      const versions: Record<string, SessionVersion> = {};
      const buildVersion = (src: SessionVersion): SessionVersion => ({
        warm_up: ensureUids(src.warm_up ?? []),
        main_block: ensureUids(src.main_block ?? []),
        cooldown: ensureUids(src.cooldown ?? []),
      });
      versions.studio = buildVersion(tpl.data);
      versions.home = buildVersion(tpl.data);

      const patchBody = {
        data: { versions, focus_label: tpl.name },
        source_focus_label: tpl.name,
        source_archetype: null,
      };

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign template");
      }

      fetch(`/api/workout-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment_usage: true }),
      }).catch(() => {});

      toast.success(`Assigned "${tpl.name}" to session`);
      setChooserSessionId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign template");
    } finally {
      setChooserBusy(false);
    }
  }

  function handleReassignOneOff(sessionId: string) {
    setChooserSessionId(null);
    router.push(`/hub/clients/${clientNumber}/add-workout?view=chooser`);
  }

  // Beyond-paid count for the note
  const beyondPaidCount = totalSessions
    ? Math.max(0, remaining - (totalQueueSlots - completedCount))
    : 0;

  return (
    <DrawerShell
      id="dw-training"
      title="Training"
      subtitle={
        programState
          ? `${programState.program.name} · ${totalSessions != null ? `${remaining} of ${totalSessions} sessions remaining` : "Ongoing"}`
          : latestBlock
            ? `${blockSessions.length} sessions`
            : allBlocks.length > 0 ? `${allBlocks.length} training periods` : "No training yet"
      }
      width="lg"
    >
      {/* ═══ STANDING RULES — stays on the page per Craig's override ═══ */}

      {/* ═══ SUPPLEMENTARY ═══ */}
      <div className="fcard">
        <div className="fcard-h">
          <span>Supplementary</span>
          <span className="sub ml-2.5 normal-case tracking-normal font-medium text-[12px] text-[var(--color-body)]">
            alongside the program · never uses a slot or paid session
          </span>
        </div>
        <div className="fcard-b">
          <SupplementaryWorkoutsCard
            clientNumber={clientNumber}
            clientName={clientName}
            sessionsRemaining={sessionsRemaining}
          />
        </div>
      </div>

      {/* ═══ BEFORE THE APP — tail of the workout-queue drawer ═══ */}
      {hasHistory && (
        <div className="fcard acc-ink">
          <div className="fcard-h">
            <span>Before the app</span>
          </div>
          <div className="fcard-b">
            {/* ── Summary stat strip ── */}
            <div className="grid grid-cols-4 gap-0 border border-[var(--hub-border)] rounded-nested bg-[var(--field-fill)] mb-2">
              <div className="flex flex-col items-center py-2 px-1.5 border-r border-[var(--hub-border)]">
                <span className="text-[13px] font-bold text-[var(--color-ink)] tabular-nums">{periodStart && periodEnd ? `${fmtShortDate(periodStart)} – ${fmtShortDate(periodEnd)}` : "—"}</span>
                <span className="text-[9.5px] font-bold uppercase tracking-[.06em] text-[var(--color-muted)] mt-0.5">Period</span>
              </div>
              <div className="flex flex-col items-center py-2 px-1.5 border-r border-[var(--hub-border)]">
                <span className="text-[13px] font-bold text-[var(--color-ink)] tabular-nums">{tBlocks.length}</span>
                <span className="text-[9.5px] font-bold uppercase tracking-[.06em] text-[var(--color-muted)] mt-0.5">Blocks</span>
              </div>
              <div className="flex flex-col items-center py-2 px-1.5 border-r border-[var(--hub-border)]">
                <span className="text-[13px] font-bold text-[var(--color-ink)] tabular-nums">{tzTotalSessions}</span>
                <span className="text-[9.5px] font-bold uppercase tracking-[.06em] text-[var(--color-muted)] mt-0.5">Sessions</span>
              </div>
              <div className="flex flex-col items-center py-2 px-1.5">
                <span className="text-[13px] font-bold text-[var(--color-ink)] tabular-nums">{notes.length}</span>
                <span className="text-[9.5px] font-bold uppercase tracking-[.06em] text-[var(--color-muted)] mt-0.5">Notes</span>
              </div>
            </div>

            {tBlocks.length > 0 && (
              <>
                <p className="text-[10.5px] font-bold uppercase tracking-[.06em] text-[var(--color-muted)] mb-1">Training history — tap to see sessions</p>
                {tBlocks.map((b) => {
                  const isOpen = expandedBlockId === b.id;
                  const performed = b.performedWorkouts ?? [];
                  return (
                    <div key={b.id}>
                      <button
                        type="button"
                        className="flex items-center gap-2.5 w-full py-1.5 border-b border-[var(--hub-border)] last:border-b-0 bg-transparent border-x-0 border-t-0 cursor-pointer font-[inherit] text-left"
                        onClick={() => setExpandedBlockId(isOpen ? null : b.id)}
                      >
                        <span className="w-[16px] shrink-0 text-[12px] text-[var(--color-muted)] text-center">{isOpen ? "▾" : "▸"}</span>
                        <span className="flex-1 min-w-0 text-[13px] text-[var(--color-ink)] font-semibold">
                          {b.phase_name || "Program"}
                          <small className="text-[11.5px] font-normal text-[var(--color-body)] ml-1.5">
                            {b.start_date && b.end_date
                              ? `${fmtShortDate(b.start_date)} – ${fmtShortDate(b.end_date)}`
                              : b.start_date
                                ? `From ${fmtShortDate(b.start_date)}`
                                : "Not dated"}
                            {" · "}
                            {performed.length > 0 ? `${performed.length} session${performed.length !== 1 ? "s" : ""} performed` : "no sessions logged"}
                          </small>
                        </span>
                      </button>
                      {isOpen && (
                        performed.length > 0
                          ? <div className="ml-[16px]">{renderPerformedList(performed)}</div>
                          : <p className="text-[12px] text-[var(--color-muted)] py-1.5 ml-[16px]">No logged sessions fell inside this program&apos;s dates.</p>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {unmatched.length > 0 && (
              <>
                <p className="text-[10.5px] font-bold uppercase tracking-[.06em] text-[var(--color-muted)] mb-1 mt-2">Outside any program</p>
                <p className="text-[12px] text-[var(--color-muted)] mb-1">
                  {unmatched.length} logged session{unmatched.length !== 1 ? "s" : ""} from before this client&apos;s first imported program.
                </p>
                {renderPerformedList(unmatched)}
              </>
            )}

            <button
              type="button"
              className="flex items-center gap-1.5 w-full py-1.5 border-b border-[var(--hub-border)] last:border-b-0 bg-transparent border-x-0 border-t-0 cursor-pointer font-[inherit] text-left mt-0.5"
              onClick={() => setNotesOpen((v) => !v)}
            >
              <span className="w-[16px] shrink-0 text-[12px] text-[var(--color-muted)] text-center">{notesOpen ? "▾" : "▸"}</span>
              <span className="text-[13px] font-semibold text-[var(--color-ink)]">Notes ({notes.length})</span>
            </button>
            {notesOpen && (
              notes.length > 0 ? (
                notes.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 w-full py-1.5 border-b border-[var(--hub-border)] last:border-b-0">
                    <span className="flex-1 min-w-0 text-[12.5px] text-[var(--color-ink)]">
                      <span className="font-semibold">{sourceLabel(n.source)}{n.sender_name ? ` · ${n.sender_name}` : ""}</span>
                      <span className="block text-[12px] text-[var(--color-body)] mt-0.5 whitespace-pre-wrap">{n.content}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--color-muted)] shrink-0 tabular-nums">{fmtShortDate(n.source_date)}</span>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-[var(--color-muted)] py-1.5">No notes or messages imported.</p>
              )
            )}

            <p className="text-[11.5px] text-[var(--color-muted)] mt-2">
              Imported history cannot be edited and does not count toward the session balance.
            </p>
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <div className="flex gap-2 mt-1.5">
        <button
          type="button"
          onClick={() => router.push(`/hub/programs?client=${clientNumber}`)}
          className="inline-flex items-center justify-center gap-1.5 rounded-control border border-[var(--hub-field-border)] bg-white px-3 py-[5px] min-h-[32px] font-[inherit] text-[12.5px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
        >
          See all workouts
        </button>
        <button
          type="button"
          onClick={() => router.push(`/hub/clients/${clientNumber}/programs/new`)}
          className="inline-flex items-center justify-center gap-1.5 rounded-control border border-transparent bg-[var(--color-rose)] text-white px-4 py-[5px] min-h-[32px] font-[inherit] text-[12.5px] font-semibold cursor-pointer hover:bg-[var(--color-rose)]/90 transition-colors ml-auto"
        >
          Plan next program
        </button>
      </div>

      {/* ═══ SESSION CHOOSER DIALOG ═══ */}
      {chooserSessionId && programState && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm"
            onClick={() => !chooserBusy && setChooserSessionId(null)}
          />
          <div className="relative w-full max-w-[680px] mx-4 bg-white border border-[var(--hub-border)] rounded-surface shadow-[0_20px_60px_rgba(16,24,40,.18)] max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-[var(--hub-border)]">
              <h3 className="m-0 text-[15.5px] font-bold text-[var(--color-ink)] tracking-tight">
                Assign this session
              </h3>
            </div>
            <div className="px-5 py-4">
              <SessionChooser
                nextSlot={programState.nextSlot}
                currentWeek={programState.currentWeek ?? 1}
                programWeeks={programState.program?.weeks ?? 1}
                slotPosition={programState.nextPosition ?? 1}
                totalSlots={totalQueueSlots}
                sessionsRemaining={remaining}
                programName={programState.program?.name ?? ""}
                clientNumber={clientNumber}
                onConfirmProgram={(slotId) => handleReassignProgram(chooserSessionId, slotId)}
                onConfirmTemplate={(templateId, templateName) => handleReassignTemplate(chooserSessionId, templateId, templateName)}
                onConfirmOneOff={() => handleReassignOneOff(chooserSessionId)}
                onCancel={() => !chooserBusy && setChooserSessionId(null)}
              />
            </div>
            {chooserBusy && (
              <div className="absolute inset-0 bg-white/60 rounded-surface flex items-center justify-center pointer-events-none">
                <span className="text-[13px] font-semibold text-[var(--color-muted)]">Saving…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SESSION MOVE/CANCEL DIALOG ═══ */}
      {moveSession && (
        <SessionMoveDialog
          session={moveSession}
          clientNumber={clientNumber}
          clientName={clientName}
          preferredTime={null}
          sessionsRemaining={sessionsRemaining}
          onClose={() => setMoveSession(null)}
        />
      )}
    </DrawerShell>
  );
}
