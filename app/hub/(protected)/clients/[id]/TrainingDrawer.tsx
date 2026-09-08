"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DrawerShell, useDrawerManager } from "./DrawerManager";
import { SessionChooser } from "./SessionChooser";
import { SupplementaryWorkoutsCard } from "@/components/hub/SupplementaryWorkoutsCard";
import { ensureUids } from "@/lib/exercise-ref";
import {
  sessionWorkoutName,
  sessionHasNoExercises,
  isOutlookPlaceholder,
  isTrainerizeImported,
} from "@/lib/session-display";
import type { DBBlock, DBSession, SessionVersion } from "@/types";
import type { QueueState } from "@/lib/programs/types";

/* ── TrainingDrawer — the Manage training drawer (DO rung).
   Five sections in mockup order:
     1. Apply a workout to a date
     2. Her programme
     3. Start or replace
     4. Supplementary
     5. Standing rules
   Handlers/API calls unchanged — this is chrome + arrangement. ────── */

function fmtShortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtDayDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const dayStr = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return isToday ? `Today, ${dayStr}` : dayStr;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function daysFromNow(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

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

/* ═══════════════════════════════════════════════════════════════════════════ */

interface TrainingDrawerProps {
  clientNumber: number;
  clientName: string;
  sessionDuration?: number | null;
  deliveryMode?: string | null;
  preferredTime?: string | null;
  latestBlock: DBBlock | null;
  blockSessions: DBSession[];
  allBlocks: DBBlock[];
  allSessions: DBSession[];
  blockDateRangeLabel?: string;
  exerciseTrendSummary?: {
    totalExercisesLogged: number;
    personalBests: number;
    heaviestLift: string | null;
    belowBestCount: number;
    recentNotes: string | null;
  };
  standingRules?: { id: string; label: string | null; detail: string }[];
  sessionsRemaining: number | null;
  sessionsPurchased: number | null;
  paymentStatus?: string | null;
  packageType?: string | null;
  programState: QueueState | null;
  flaggedSessionIds: Set<string>;
  activeProgramId?: string | null;
  clientId: string;
}

export function TrainingDrawer({
  clientNumber,
  clientName,
  latestBlock,
  blockSessions,
  allBlocks,
  allSessions: _allSessions,
  standingRules = [],
  sessionsRemaining,
  sessionsPurchased,
  packageType,
  programState,
  clientId,
}: TrainingDrawerProps) {
  const router = useRouter();
  const { closeDrawer, openDrawer } = useDrawerManager();

  // ── Dialog state ──
  const [chooserSessionId, setChooserSessionId] = useState<string | null>(null);
  const [chooserBusy, setChooserBusy] = useState(false);

  // ── Available programmes for Section 3 ──
  const [libraryProgrammes, setLibraryProgrammes] = useState<{ id: string; name: string; weeks: number }[]>([]);
  const [allOtherProgrammes, setAllOtherProgrammes] = useState<{ id: string; name: string; weeks: number; clientNumber: string | null; clientName: string | null }[]>([]);
  const [applyingProgramId, setApplyingProgramId] = useState<string | null>(null);
  const [showCopySearch, setShowCopySearch] = useState(false);
  const [copySearchQuery, setCopySearchQuery] = useState("");
  const [selectedCopyClient, setSelectedCopyClient] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/programs")
      .then((r) => r.json())
      .then((rows: { id: string; name: string; weeks: number; client_id: string | null; status: string; clients?: { client_number: string | null; name?: string | null } | null }[]) => {
        if (cancelled) return;
        const currentId = programState?.program?.id;
        const active = rows.filter((p) => p.status !== "archived" && p.id !== currentId);
        // Library = no client_id (unbound templates)
        setLibraryProgrammes(
          active.filter((p) => !p.client_id).map((p) => ({ id: p.id, name: p.name, weeks: p.weeks }))
        );
        // Other clients' programmes for the copy search
        setAllOtherProgrammes(
          active
            .filter((p) => p.client_id && p.clients?.client_number !== String(clientNumber))
            .map((p) => ({
              id: p.id,
              name: p.name,
              weeks: p.weeks,
              clientNumber: p.clients?.client_number ?? null,
              clientName: p.clients?.name ?? null,
            }))
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [programState?.program?.id, clientNumber]);

  // Derived: other clients' programmes grouped by client, filtered by search
  const copyClientGroups = useMemo(() => {
    const groups = new Map<string, { clientName: string; programmes: typeof allOtherProgrammes }>();
    const q = copySearchQuery.toLowerCase();
    for (const p of allOtherProgrammes) {
      if (!p.clientNumber) continue;
      if (q && !p.name.toLowerCase().includes(q) && !(p.clientName ?? "").toLowerCase().includes(q)) continue;
      const existing = groups.get(p.clientNumber);
      if (existing) {
        existing.programmes.push(p);
      } else {
        groups.set(p.clientNumber, { clientName: p.clientName ?? `Client ${p.clientNumber}`, programmes: [p] });
      }
    }
    return [...groups.entries()];
  }, [allOtherProgrammes, copySearchQuery]);

  async function handleApplyProgramme(programId: string) {
    setApplyingProgramId(programId);
    try {
      const res = await fetch(`/api/clients/${clientId}/apply-program`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program_id: programId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to apply programme");
      toast.success(data.cloned ? "Programme applied (copied to client)" : "Programme applied");
      router.push(`/hub/clients/${clientNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setApplyingProgramId(null);
    }
  }

  // ── Paid-pot computation ──
  const isOngoing = !sessionsPurchased || packageType === "ongoing";
  const totalSessions = isOngoing ? null : sessionsPurchased;
  const remaining = sessionsRemaining ?? 0;

  // ── Programme queue derivation ──
  const slots = programState?.slots ?? [];
  const totalQueueSlots = programState?.totalSlots ?? 0;
  const completedCount = programState?.completedCount ?? 0;
  const slotCount = programState?.slotCount ?? slots.length;
  const programmeWeeks = programState?.program?.weeks ?? 1;
  const programmeName = programState?.program?.name ?? "";
  const nextPosition = programState?.nextPosition ?? 1;

  // ── Scheduled sessions for "Apply a workout to a date" ──
  const scheduledSessions = useMemo(() => {
    return blockSessions
      .filter(
        (s) =>
          s.scheduled_at &&
          !s.completed_at &&
          !s.cancelled_at &&
          !s.parent_session_id,
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at!).getTime() -
          new Date(b.scheduled_at!).getTime(),
      );
  }, [blockSessions]);

  // Count sessions with nothing applied
  const nothingAppliedCount = scheduledSessions.filter((s) => {
    return isOutlookPlaceholder(s) || sessionHasNoExercises(s.data) || isTrainerizeImported(s);
  }).length;

  // ── Programme map derivation ──
  const mapData = useMemo(() => {
    if (!programState) return null;

    const weeks: {
      label: string;
      cells: {
        position: number;
        label: string;
        dateLabel: string;
        state: "done" | "flag" | "next" | "beyond" | "applied" | "empty";
      }[];
    }[] = [];

    // Build position-to-scheduled-date lookup
    const posToDate: Record<number, string> = {};
    // Completed sessions (ascending by completed_at) map to positions 1..completedCount
    const completedAscending = blockSessions
      .filter(
        (s) =>
          s.completed_at &&
          !s.cancelled_at &&
          !s.parent_session_id &&
          !(
            (s.data as unknown as Record<string, unknown>)?.program_repeat
          ),
      )
      .sort(
        (a, b) =>
          new Date(a.completed_at!).getTime() -
          new Date(b.completed_at!).getTime(),
      );
    for (let i = 0; i < completedAscending.length && i < completedCount; i++) {
      const s = completedAscending[i];
      posToDate[i + 1] = s.scheduled_at ?? s.completed_at!;
    }
    // Scheduled (not completed) sessions
    const schedAsc = blockSessions
      .filter(
        (s) =>
          s.scheduled_at &&
          !s.completed_at &&
          !s.cancelled_at &&
          !s.parent_session_id,
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at!).getTime() -
          new Date(b.scheduled_at!).getTime(),
      );
    for (const s of schedAsc) {
      const slot = s.program_slot_id
        ? slots.find((sl) => sl.id === s.program_slot_id)
        : null;
      if (slot && s.week) {
        const pos = (s.week - 1) * slotCount + slot.position;
        if (pos > 0 && pos <= totalQueueSlots) {
          posToDate[pos] = s.scheduled_at!;
          continue;
        }
      }
    }

    for (let w = 1; w <= programmeWeeks; w++) {
      const cells: (typeof weeks)[0]["cells"] = [];
      for (let p = 0; p < slotCount; p++) {
        const pos = (w - 1) * slotCount + p + 1;
        const slot = slots[p];
        const slotLbl = slot ? slotLabel(slot) : String.fromCharCode(65 + p);
        const dateStr = posToDate[pos];
        const dateLabel = dateStr ? fmtShortDate(dateStr) : "";

        let state: (typeof cells)[0]["state"] = "empty";
        if (pos <= completedCount) {
          // NOTE: Distinguishing "completed with sets" (done) from "completed,
          // no sets logged" (flag) requires set_logs data not available in
          // drawer props. Treating all completed as done for now; flag state
          // needs a dedicated set-log count prop from the server.
          state = "done";
        } else if (pos === nextPosition) {
          state = "next";
        } else if (pos > totalQueueSlots - (totalSessions ? Math.max(0, remaining - (totalQueueSlots - completedCount)) : 0) && totalSessions) {
          state = "beyond";
        } else if (dateStr) {
          state = "applied";
        }

        cells.push({ position: pos, label: slotLbl, dateLabel, state });
      }
      weeks.push({ label: `Week ${w}`, cells });
    }

    return { weeks, slotLabels: slots.map(slotLabel) };
  }, [
    programState,
    blockSessions,
    completedCount,
    slotCount,
    programmeWeeks,
    totalQueueSlots,
    totalSessions,
    remaining,
    slots,
  ]);

  // Beyond-paid count
  const beyondPaidCount = totalSessions
    ? Math.max(0, remaining - (totalQueueSlots - completedCount))
    : 0;

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
      toast.success("Session reassigned to programme slot");
      setChooserSessionId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reassign");
    } finally {
      setChooserBusy(false);
    }
  }

  async function handleReassignTemplate(
    sessionId: string,
    templateId: string,
    templateName: string,
  ) {
    setChooserBusy(true);
    try {
      const tplRes = await fetch("/api/workout-templates");
      if (!tplRes.ok) throw new Error("Could not load template data");
      const tplList: { id: string; name: string; data: SessionVersion }[] =
        await tplRes.json();
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
      toast.error(
        err instanceof Error ? err.message : "Failed to assign template",
      );
    } finally {
      setChooserBusy(false);
    }
  }

  function handleReassignOneOff(sessionId: string) {
    setChooserSessionId(null);
    router.push(`/hub/clients/${clientNumber}/add-workout?view=chooser`);
  }

  // ── Footer ──
  const footer = (
    <>
      <button
        type="button"
        onClick={closeDrawer}
        className="inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 py-1.5 min-h-[30px] font-[inherit] text-[12.5px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
      >
        Close
      </button>
      <span className="flex-1" />
      <button
        type="button"
        onClick={() => router.push(`/hub/clients/${clientNumber}/programs/new`)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] px-3 py-1.5 min-h-[30px] font-[inherit] text-[12.5px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
      >
        Plan the next programme
      </button>
      <button
        type="button"
        onClick={() => {
          // Open the first unapplied session's chooser, or just show info
          if (scheduledSessions.length > 0) {
            const firstEmpty = scheduledSessions.find(
              (s) => isOutlookPlaceholder(s) || sessionHasNoExercises(s.data),
            );
            if (firstEmpty) {
              setChooserSessionId(firstEmpty.id);
            }
          }
        }}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-rose)] text-white px-4 py-1.5 min-h-[30px] font-[inherit] text-[12.5px] font-semibold cursor-pointer hover:bg-[var(--color-rose)]/90 transition-colors"
      >
        Apply a workout
      </button>
    </>
  );

  return (
    <DrawerShell
      id="dw-training"
      title="Manage training"
      subtitle={
        <>
          {clientName}
          {programmeName && <> · {programmeName}</>}
          {totalSessions != null
            ? <> · {remaining} of {totalSessions} sessions left</>
            : <> · Ongoing</>}
        </>
      }
      width="lg"
      footer={footer}
    >
      {/* ═══ 1. APPLY A WORKOUT TO A DATE ═══ */}
      <div className="fcard acc-rose">
        <div className="fcard-h">
          Apply a workout to a date
          {scheduledSessions.length > 0 && (
            <span className="sub">
              {nothingAppliedCount > 0
                ? `${nothingAppliedCount} of ${scheduledSessions.length} booked date${scheduledSessions.length === 1 ? "" : "s"} have nothing applied`
                : `All ${scheduledSessions.length} booked date${scheduledSessions.length === 1 ? "" : "s"} have a workout`}
            </span>
          )}
        </div>
        <div className="fcard-b">
          {scheduledSessions.length === 0 ? (
            <p className="miss">No booked dates in this training period.</p>
          ) : (
            <>
              {/* Dates with nothing applied first, then dates with workouts */}
              {[
                ...scheduledSessions.filter(
                  (s) => isOutlookPlaceholder(s) || sessionHasNoExercises(s.data) || isTrainerizeImported(s),
                ),
                ...scheduledSessions.filter(
                  (s) => !isOutlookPlaceholder(s) && !sessionHasNoExercises(s.data) && !isTrainerizeImported(s),
                ),
              ].map((s) => {
                const hasWorkout =
                  !isOutlookPlaceholder(s) && !sessionHasNoExercises(s.data) && !isTrainerizeImported(s);
                const workoutName = sessionWorkoutName(s, "");
                const dateStr = s.scheduled_at!;
                const d = new Date(dateStr);
                const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });
                const dateNum = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                const time = fmtTime(dateStr);
                const isToday =
                  d.getFullYear() === new Date().getFullYear() &&
                  d.getMonth() === new Date().getMonth() &&
                  d.getDate() === new Date().getDate();
                const dateLabel = isToday
                  ? `Today, ${dayName} ${dateNum}`
                  : `${dayName} ${dateNum}`;
                const relativeDays = daysFromNow(dateStr);
                // Exercise count for sessions with workouts
                const v = s.data?.versions?.studio;
                const exCount = v
                  ? (v.warm_up?.length ?? 0) +
                    (v.main_block?.length ?? 0) +
                    (v.cooldown?.length ?? 0)
                  : 0;
                const estMin = s.data?.estimated_minutes;

                return (
                  <div className="arow2" key={s.id}>
                    <span className="arow2-d">
                      {dateLabel}
                      <small>
                        {time}
                        {relativeDays !== "today" && <> · {relativeDays}</>}
                      </small>
                    </span>
                    {hasWorkout ? (
                      <span className="arow2-w">
                        {workoutName}
                        <small>
                          {exCount > 0 && `${exCount} exercise${exCount !== 1 ? "s" : ""}`}
                          {exCount > 0 && estMin && " · "}
                          {estMin && `${estMin} min`}
                          {s.program_slot_id && (() => {
                            const slot = slots.find((sl) => sl.id === s.program_slot_id);
                            return slot ? <> · position {slot.position}</> : null;
                          })()}
                        </small>
                      </span>
                    ) : (
                      <span className="arow2-w none">
                        Nothing applied
                        <small style={{ color: "var(--color-muted-text)", fontWeight: 400 }}>
                          {programState && nextPosition <= totalQueueSlots
                            ? `Position ${nextPosition} is next in her programme`
                            : "No programme position available"}
                        </small>
                      </span>
                    )}
                    <span className="arow2-a">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-rose)] text-white px-3 py-1 min-h-[30px] font-[inherit] text-[12px] font-semibold cursor-pointer hover:bg-[var(--color-rose)]/90 transition-colors"
                        onClick={() => setChooserSessionId(s.id)}
                      >
                        Choose a workout
                      </button>
                    </span>
                  </div>
                );
              })}
              <p className="miss" style={{ marginTop: 10 }}>
                A workout can be applied on the day or ahead of time — the rule is unchanged. Applying one takes nothing from the pot; only completing it does.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ═══ 2. HER PROGRAMME ═══ */}
      {programState && mapData && (
        <div className="fcard acc-teal">
          <div className="fcard-h">
            Her programme
            <span className="sub">
              {programmeName} · {slotCount}× per week · {totalQueueSlots} positions, {completedCount} reached
            </span>
            <button type="button" className="btn-link" disabled aria-disabled="true" title="Coming soon" style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Reorder
            </button>
          </div>
          <div className="fcard-b">
            <div className="pmap">
              {/* Legend: which slot label means which workout */}
              <div className="pmap-legend">
                {mapData.slotLabels.map((lbl, i) => (
                  <span key={i}>
                    <b>{lbl}</b>
                    {slots[i]?.label?.trim() || `Workout ${lbl}`}
                  </span>
                ))}
              </div>
              {/* Week rows */}
              {mapData.weeks.map((week) => (
                <div className="pmap-week" key={week.label}>
                  <span className="pmap-lbl">{week.label}</span>
                  <span className="pmap-cells">
                    {week.cells.map((cell) => (
                      <button
                        key={cell.position}
                        type="button"
                        className={`mcell ${cell.state}`}
                        title={`Position ${cell.position}${
                          cell.state === "done"
                            ? " — completed"
                            : cell.state === "flag"
                              ? " — completed, no sets logged"
                              : cell.state === "next"
                                ? " — next up"
                                : cell.state === "beyond"
                                  ? ` — beyond the ${remaining} remaining paid sessions`
                                  : cell.state === "applied"
                                    ? " — applied"
                                    : " — nothing applied"
                        }`}
                      >
                        {cell.dateLabel && <small>{cell.dateLabel}</small>}
                        <b>{cell.label}</b>
                      </button>
                    ))}
                  </span>
                </div>
              ))}
              {/* Map key */}
              <div className="map-key">
                <span>
                  <i className="done" />Completed
                </span>
                <span>
                  <i className="flag" />Completed, no sets logged
                </span>
                <span>
                  <i className="next" />Next up
                </span>
                {totalSessions && (
                  <span>
                    <i className="beyond" />Beyond the {remaining} paid sessions
                  </span>
                )}
                <span>Plain cells are applied and to come</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => router.push(`/hub/clients/${clientNumber}/programs/${programState.program.id}`)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] px-3 py-1.5 min-h-[30px] font-[inherit] text-[12px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
              >
                Add workouts
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Coming soon"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] px-3 py-1.5 min-h-[30px] font-[inherit] text-[12px] font-medium text-[var(--color-body)] cursor-not-allowed opacity-50 transition-colors"
              >
                Move one later
              </button>
              <span className="flex-1" />
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Coming soon"
                className="inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 py-1.5 min-h-[30px] font-[inherit] text-[12px] font-medium text-[var(--color-body)] cursor-not-allowed opacity-50 transition-colors"
              >
                Manage the pot
              </button>
            </div>
            {beyondPaidCount > 0 && (
              <p className="miss mt-2.5">
                <b style={{ color: "var(--color-amber-text)" }}>
                  {beyondPaidCount} position{beyondPaidCount === 1 ? "" : "s"} run{beyondPaidCount === 1 ? "s" : ""} past the pot.
                </b>{" "}
                {clientName} needs a renewal, or those sessions have nothing to bill against.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ 3. START OR REPLACE ═══ */}
      <div className="fcard acc-teal">
        <div className="fcard-h">
          Start or replace the programme
          <span className="sub">Copies in \u2014 never links, so editing hers changes nobody else&apos;s</span>
        </div>
        <div className="fcard-b">
          {programState && (
            <div className="prow">
              <span className="prow-m">
                <span className="prow-t">{programmeName}</span>
                <span className="prow-s">
                  {totalQueueSlots} workouts \u00b7 currently hers
                </span>
              </span>
              <span className="prow-a">
                <span className="inline-flex items-center rounded-pill border border-[var(--hub-border)] bg-[var(--hub-hover)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-body)]">
                  In use
                </span>
              </span>
            </div>
          )}
          {libraryProgrammes.length > 0 && libraryProgrammes.map((p) => (
            <div className="prow" key={p.id}>
              <span className="prow-m">
                <span className="prow-t">{p.name}</span>
                <span className="prow-s">{p.weeks} weeks</span>
              </span>
              <span className="prow-a">
                <button
                  type="button"
                  disabled={applyingProgramId === p.id}
                  onClick={() => handleApplyProgramme(p.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-rose)] text-white px-3 py-1 min-h-[28px] font-[inherit] text-[11.5px] font-semibold cursor-pointer hover:bg-[var(--color-rose)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applyingProgramId === p.id ? "Applying\u2026" : "Apply"}
                </button>
              </span>
            </div>
          ))}
          {libraryProgrammes.length === 0 && (
            <p className="miss" style={{ margin: "0 0 8px" }}>No library programmes yet. Build one first, then apply it here.</p>
          )}

          {/* Copy from another client */}
          <div style={{ marginTop: 12, borderTop: "1px solid var(--hub-border)", paddingTop: 10 }}>
            {!showCopySearch ? (
              <button
                type="button"
                onClick={() => setShowCopySearch(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 py-1.5 min-h-[28px] font-[inherit] text-[12px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
              >
                Copy from another client\u2026
              </button>
            ) : (
              <div>
                <input
                  className="fld"
                  placeholder="Search by programme or client name\u2026"
                  value={copySearchQuery}
                  onChange={(e) => { setCopySearchQuery(e.target.value); setSelectedCopyClient(null); }}
                  style={{ marginBottom: 8 }}
                />
                {selectedCopyClient ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedCopyClient(null)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-rose)] hover:underline mb-2 bg-transparent border-0 p-0 cursor-pointer font-[inherit]"
                    >
                      \u2039 Back to search
                    </button>
                    {copyClientGroups.find(([id]) => id === selectedCopyClient)?.[1].programmes.map((p) => (
                      <div className="prow" key={p.id}>
                        <span className="prow-m">
                          <span className="prow-t">{p.name}</span>
                          <span className="prow-s">{p.weeks} weeks</span>
                        </span>
                        <span className="prow-a">
                          <button
                            type="button"
                            disabled={applyingProgramId === p.id}
                            onClick={() => handleApplyProgramme(p.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-rose)] text-white px-3 py-1 min-h-[28px] font-[inherit] text-[11.5px] font-semibold cursor-pointer hover:bg-[var(--color-rose)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {applyingProgramId === p.id ? "Applying\u2026" : "Apply"}
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {copyClientGroups.length > 0 ? copyClientGroups.map(([clientId, group]) => (
                      <button
                        key={clientId}
                        type="button"
                        onClick={() => setSelectedCopyClient(clientId)}
                        className="w-full text-left px-3 py-2 rounded-control border border-[var(--hub-border)] bg-white mb-1.5 cursor-pointer hover:bg-[var(--hub-hover)] transition-colors font-[inherit]"
                      >
                        <span className="text-[13px] font-semibold text-[var(--color-ink)]">{group.clientName}</span>
                        <span className="text-[12px] text-[var(--color-muted)] ml-1.5">{group.programmes.length} programme{group.programmes.length !== 1 ? "s" : ""}</span>
                      </button>
                    )) : (
                      <p className="miss" style={{ margin: 0 }}>No other clients&apos; programmes found.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => { setShowCopySearch(false); setCopySearchQuery(""); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 py-1.5 min-h-[28px] font-[inherit] text-[12px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors mt-1"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => router.push(`/hub/clients/${clientNumber}/programs/new`)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] px-3 py-1.5 min-h-[30px] font-[inherit] text-[12px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
            >
              Build from scratch
            </button>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => router.push(`/hub/programs?client=${clientNumber}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 py-1.5 min-h-[30px] font-[inherit] text-[12px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
            >
              All programmes
            </button>
            <button
              type="button"
              onClick={() => router.push(`/hub/clients/${clientNumber}/programs/new`)}
              className="inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 py-1.5 min-h-[30px] font-[inherit] text-[12px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
            >
              Open the builder
            </button>
          </div>
          <p className="miss mt-2.5">
            Applying a different programme replaces what is not yet completed. Positions already done stay on her record.
          </p>
        </div>
      </div>

      {/* ═══ 4. SUPPLEMENTARY ═══ */}
      <div className="fcard">
        <div className="fcard-h">
          Supplementary
          <span className="sub">Runs alongside · never uses a session</span>
        </div>
        <div className="fcard-b">
          <SupplementaryWorkoutsCard
            clientNumber={clientNumber}
            clientName={clientName}
            sessionsRemaining={sessionsRemaining}
          />
        </div>
      </div>

      {/* ═══ 5. STANDING RULES ═══ */}
      <div className="fcard acc-amber">
        <div className="fcard-h">
          Standing rules
          <span className="sub">Apply to everything applied above</span>
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              closeDrawer();
              setTimeout(() => openDrawer("dw-arrangement"), 300);
            }}
          >
            Edit rules
          </button>
        </div>
        <div className="fcard-b">
          {standingRules.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const groups = new Map<string, typeof standingRules>();
                for (const r of standingRules) {
                  const cat = r.label || "General";
                  const existing = groups.get(cat);
                  if (existing) existing.push(r);
                  else groups.set(cat, [r]);
                }
                return [...groups.entries()].map(([cat, rules]) => (
                  <div key={cat}>
                    <div className="text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--color-muted)" }}>
                      {cat}
                    </div>
                    {rules.map((r) => (
                      <p key={r.id} className="text-[13px] text-[var(--color-ink)] m-0 mb-1.5" style={{ whiteSpace: "pre-wrap" }}>
                        {r.detail}
                      </p>
                    ))}
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="miss">
              No standing rules for {clientName} yet.
            </p>
          )}
        </div>
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
                onConfirmProgram={(slotId) =>
                  handleReassignProgram(chooserSessionId, slotId)
                }
                onConfirmTemplate={(templateId, templateName) =>
                  handleReassignTemplate(
                    chooserSessionId,
                    templateId,
                    templateName,
                  )
                }
                onConfirmOneOff={() =>
                  handleReassignOneOff(chooserSessionId)
                }
                onCancel={() =>
                  !chooserBusy && setChooserSessionId(null)
                }
              />
            </div>
            {chooserBusy && (
              <div className="absolute inset-0 bg-white/60 rounded-surface flex items-center justify-center pointer-events-none">
                <span className="text-[13px] font-semibold text-[var(--color-muted)]">
                  Saving…
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </DrawerShell>
  );
}
