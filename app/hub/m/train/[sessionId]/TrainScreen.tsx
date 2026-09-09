"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Session, SessionLog, SetLog, Exercise, DeliveryMode } from "@/types";
import type { Band } from "@/lib/bands";
import { bandLoadOptionsLb, snapBandLoadLb } from "@/lib/band-load";
import type { LastSessionPrefill, PbMetadata } from "@/lib/last-session-data";
import { computeGroups, nextGroupLabel, checkSupersetSetCounts } from "@/lib/exercise-groups";
import { isTimeBased, parsePrescribedSeconds, parsePrescribedReps, parseRestSeconds, formatPrescription } from "@/lib/prescription";
import { parseLoad, prescribedWeight } from "@/lib/load-helpers";
import { sessionDurationMinutes } from "@/lib/scheduling";
import { defaultUnitForEquipment, isBandEquipment } from "@/lib/units";
import { sessionWorkoutName } from "@/lib/session-display";
import { type PendingSetLogEntry } from "@/lib/hub/offline-set-log-queue";
import { enqueueCompletion } from "@/lib/hub/offline-set-log-queue";
import { saveSetLog, drainSetLogQueue, type SaveSetLogResult } from "@/lib/workout/save-set-log";
import { completeSession } from "@/lib/workout/complete-session";
import { stableSetOpId } from "@/lib/set-log-id";
import { displayWeight, exerciseRefKey, mmss, type SectionKey, SECTION_DEFS } from "@/lib/workout/helpers";
import { SwapChooser } from "./SwapChooser";
import { MoveCancelSheet } from "./MoveCancelSheet";

interface SetState {
  status: "pending" | "done" | "skipped";
  reps: string;
  weight: string;
  duration: string;
  bandColour?: string;
  savedId?: string;
  isNewPb?: boolean;
  isWarmup: boolean;
  /** Set write is parked in the offline queue, not yet on the server. */
  pendingSync?: boolean;
  /** Idempotency key for the queued write — reused across re-taps so a toggle
   *  overwrites the queued entry rather than stacking a second one. */
  clientOpId?: string;
  /** CR-EF-010 — original prefilled values from last session (for undo). */
  prefillWeight?: string;
  prefillDuration?: string;
  prefillBandColour?: string;
}

interface PbInfo {
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  achieved_at: string;
}

interface LastSessionInfo {
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  band_colour: string | null;
  session_date: string;
  session_number: number | null;
}

interface ExState {
  uid: string;
  sets: SetState[];
  note: string;
  noteOpen: boolean;
  displayUnit: "kg" | "lb";
  /** CR-EF-010 — PB info for the exercise header chip. */
  pbInfo?: PbInfo;
  /** CR-EF-010 — last session data for the "Last X" chip and prefill. */
  lastSession?: LastSessionInfo;
}

interface RestTimer {
  mode: "countdown" | "stopwatch";
  elapsed: number;
  seconds: number;
}

// ── Helpers ──────────────────────────────────────────────────────

function leadNum(s: string): number | null {
  const m = /^(\d+)/.exec(String(s).trim());
  return m ? parseInt(m[1], 10) : null;
}

// ── Icons (inline SVG, matching mockup) ─────────────────────────

const ICO = {
  check: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>),
  checkSm: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>),
  checkLg: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>),
  skip: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>),
  note: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  video: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>),
  chev: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
  clock: (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  reps: (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6v12M17.5 6v12M2 10h2M2 14h2M20 10h2M20 14h2M8.5 10h7v4h-7z"/></svg>),
  plus: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>),
  rest: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/></svg>),
  ungroup: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H5a2 2 0 0 0-2 2v3M16 6h3a2 2 0 0 1 2 2v3M8 18H5a2 2 0 0 1-2-2v-3M16 18h3a2 2 0 0 0 2-2v-3M2 2l20 20"/></svg>),
  link: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>),
  img: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.7" cy="8.7" r="1.6"/><path d="m21 15-5-5L5 21"/></svg>),
  back: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>),
  edit: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>),
  flame: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>),
  lightning: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  moon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>),
};

// ── Main Component ───────────────────────────────────────────────

export function TrainScreen({
  sessionId,
  sessionNumber,
  archetype,
  phase,
  week,
  hasProgram,
  data,
  sessionLog,
  scheduledAt,
  blockNumber,
  clientId,
  clientName,
  clientNumber,
  setLogs,
  deliveryMode,
  bestWeights,
  lastSessionData,
  pbDates,
  bands,
  initialSessionNote,
  initialSessionNoteId,
  subSessions = [],
  isCompleted = false,
  completedAt = null,
}: {
  sessionId: string;
  sessionNumber: number;
  archetype: string;
  phase: string;
  week: number;
  hasProgram: boolean;
  data: Session | null;
  sessionLog: SessionLog | null;
  scheduledAt: string | null;
  blockNumber: number | null;
  clientId: string | null;
  clientName: string;
  clientNumber: number | null;
  setLogs: SetLog[];
  deliveryMode: DeliveryMode;
  /** Client's best-ever weight_kg per exercise name — prefills a set's weight
   *  field when this session has no log for it yet. */
  bestWeights?: Record<string, number>;
  /** CR-EF-010 — last session's best set per exercise (for prefill). */
  lastSessionData?: Record<string, LastSessionPrefill>;
  /** CR-EF-014 — PB metadata per exercise (for header chip). */
  pbDates?: Record<string, PbMetadata>;
  /** CR-EF-014: active bands for the colour picker. */
  bands?: Band[];
  /** BUG-EF-107 — latest client_notes entry for this session, so the note
   *  sheet opens pre-populated when the trainer returns to the workout. */
  initialSessionNote?: string | null;
  /** BUG-EF-107 — id of the latest client_notes row, so re-saving can update
   *  instead of insert. */
  initialSessionNoteId?: string | null;
  /** CR-EF-169 — child sub-sessions (supplementary work) attached to this session */
  subSessions?: { id: string; name: string; exerciseCount: number }[];
  /** Phase 2 — one-time completion semantics: session is already completed */
  isCompleted?: boolean;
  /** Phase 2 — ISO timestamp of when the session was completed */
  completedAt?: string | null;
}) {
  const version = deliveryMode === "home_training" ? "home" : "studio";
  const sections = data?.versions?.[version] ?? { warm_up: [], main_block: [], cooldown: [] };

  const durationMinutes = data?.estimated_minutes ?? sessionDurationMinutes(data?.time_tier);
  const router = useRouter();

  // Phase 2 — derived completion flag (also tracks in-flight completion)
  const sessionCompleted = isCompleted || !!sessionLog?.completed_at;

  const setLogsMap = useMemo(() => {
    const map: Record<string, SetLog> = {};
    for (const sl of setLogs) {
      map[`${sl.exercise_ref}::${sl.set_number}`] = sl;
    }
    return map;
  }, [setLogs]);

  const savedNotesRef = useRef<Record<string, string>>({});
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initExStates = useCallback(
    (exercises: Exercise[], sectionKey: SectionKey): Record<string, ExState> => {
      const map: Record<string, ExState> = {};
      exercises.forEach((ex, idx) => {
        const uid = ex.uid ?? crypto.randomUUID();
        const ref = exerciseRefKey(version, sectionKey, idx, ex.exercise_name);
        const totalSets = Math.max(1, ex.sets || 1);
        const warmupCount = ex.warmup_sets ?? 0;
        const sets: SetState[] = [];
        const isBand = isBandEquipment(ex.equipment ?? []);
        const timeBased = isTimeBased(ex.reps, ex.log_type);
        const unit = ex.weight_unit ?? defaultUnitForEquipment(ex.equipment ?? []);
        const last = lastSessionData?.[ex.exercise_name];

        // CR-EF-010 + CR-EF-124: prescribed load takes precedence over last-session prefill.
        const prescKg = prescribedWeight(ex.load);
        const prefillWeight = !isBand && !timeBased
          ? (prescKg != null
            ? displayWeight(prescKg, unit)
            : last?.weight_kg != null
              ? displayWeight(last.weight_kg, unit)
              : undefined)
          : undefined;
        const prefillDuration = timeBased && last?.duration_seconds != null
          ? String(last.duration_seconds)
          : undefined;
        const prefillBandColour = isBand && last?.band_colour
          ? last.band_colour
          : undefined;

        for (let s = 1; s <= totalSets; s++) {
          const log = setLogsMap[`${ref}::${s}`];
          const hasLog = !!log;
          sets.push({
            status: log ? (log.completed ? "done" : "skipped") : "pending",
            reps: log?.reps != null ? String(log.reps) : "",
            weight: log?.weight_kg != null
              ? displayWeight(log.weight_kg, unit)
              : prefillWeight ?? "",
            duration: log?.duration_seconds != null
              ? String(log.duration_seconds)
              : prefillDuration ?? "",
            bandColour: log?.band_colour ?? prefillBandColour ?? "",
            savedId: log?.id,
            isNewPb: log ? !!(log as SetLog & { is_new_pb?: boolean }).is_new_pb : undefined,
            isWarmup: s <= warmupCount,
            prefillWeight: !hasLog ? prefillWeight : undefined,
            prefillDuration: !hasLog ? prefillDuration : undefined,
            prefillBandColour: !hasLog ? prefillBandColour : undefined,
          });
        }
        if (savedNotesRef.current[uid] === undefined) {
          savedNotesRef.current[uid] = data?.exercise_notes?.[uid] ?? "";
        }
        map[uid] = {
          uid,
          sets,
          note: savedNotesRef.current[uid],
          noteOpen: false,
          displayUnit: ex.weight_unit ?? defaultUnitForEquipment(ex.equipment ?? []),
          pbInfo: pbDates?.[ex.exercise_name],
          lastSession: last,
        };
      });
      return map;
    },
    [version, setLogsMap, data, lastSessionData, pbDates],
  );

  const [exStates, setExStates] = useState<Record<string, ExState>>(() => {
    const all: Record<string, ExState> = {};
    for (const sec of SECTION_DEFS) {
      Object.assign(all, initExStates(sections[sec.key] || [], sec.key));
    }
    // BUG-EF-135 — restore draft field values from localStorage. Only pending
    // sets get restored; completed/skipped sets already have server-side data.
    try {
      const raw = localStorage.getItem(`ef-session-draft:${sessionId}`);
      if (raw) {
        const draft = JSON.parse(raw) as { sets?: Record<string, { reps?: string; weight?: string; duration?: string }>; summary?: { rpe?: number | null; fatigue?: string | null; sessionNotes?: string } };
        if (draft.sets) {
          for (const uid of Object.keys(all)) {
            const savedSetDraft = draft.sets[uid];
            if (!savedSetDraft) continue;
            const st = all[uid];
            if (!st) continue;
            for (let i = 0; i < st.sets.length; i++) {
              const s = st.sets[i];
              if (s.status !== "pending") continue;
              const sd = savedSetDraft;
              if (sd.reps !== undefined) s.reps = sd.reps;
              if (sd.weight !== undefined) s.weight = sd.weight;
              if (sd.duration !== undefined) s.duration = sd.duration;
            }
          }
        }
        if (draft.summary) {
          if (draft.summary.rpe != null && sessionLog?.rpe == null) rpeRef.current = draft.summary.rpe;
          if (draft.summary.fatigue != null && sessionLog?.fatigue == null) fatigueRef.current = draft.summary.fatigue as SessionLog["fatigue"];
          if (draft.summary.sessionNotes && !sessionLog?.notes) sessionNotesRef.current = draft.summary.sessionNotes;
        }
      }
    } catch { /* fine — render with nothing stored */ }
    return all;
  });

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // BUG-EF-135 — refs that the draft restore in the exStates initializer reads
  // before the corresponding useState hooks run (useState initializers are
  // closures that capture these refs).
  const rpeRef = useRef<number | null>(sessionLog?.rpe ?? null);
  const fatigueRef = useRef<SessionLog["fatigue"]>(sessionLog?.fatigue ?? null);
  const sessionNotesRef = useRef(sessionLog?.notes ?? "");

  const [rpe, setRpe] = useState<number | null>(() => rpeRef.current);
  const [fatigue, setFatigue] = useState<SessionLog["fatigue"]>(() => fatigueRef.current);
  const [sessionNotes, setSessionNotes] = useState(() => sessionNotesRef.current);
  const [showComplete, setShowComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [restTimers, setRestTimers] = useState<Record<string, RestTimer>>({});
  const [restOverrides, setRestOverrides] = useState<Record<string, number>>({});

  const [pickSection, setPickSection] = useState<SectionKey | null>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(initialSessionNote ?? "");
  const [noteSaving, setNoteSaving] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(initialSessionNoteId ?? null);
  const [lastSavedNoteText, setLastSavedNoteText] = useState<string | null>(initialSessionNote ?? null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [moveCancelOpen, setMoveCancelOpen] = useState(false);
  const [moveCancelData, setMoveCancelData] = useState<{ allSessions: { id: string; scheduled_at: string | null }[]; sessionsPurchased: number | null } | null>(null);

  const [offline, setOffline] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alertedRef = useRef<Set<string>>(new Set());
  const dataRef = useRef(data);
  const sessionLogRef = useRef(sessionLog);
  dataRef.current = data;
  sessionLogRef.current = sessionLog;

  const allSets = useMemo(() => {
    const total: { uid: string; sets: SetState[] }[] = [];
    for (const sec of SECTION_DEFS) {
      for (const ex of sections[sec.key] || []) {
        const uid = ex.uid;
        if (!uid) continue;
        const state = exStates[uid];
        if (state) total.push({ uid, sets: state.sets });
      }
    }
    return total;
  }, [sections, exStates]);

  const progress = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const entry of allSets) {
      total += entry.sets.length;
      done += entry.sets.filter((s) => s.status !== "pending").length;
    }
    const started = done > 0;
    const doneExCount = allSets.filter((entry) => entry.sets.every((s) => s.status !== "pending")).length;
    return { total, done, started, doneExCount, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [allSets]);

  const pendingCount = useMemo(() => {
    let count = 0;
    for (const entry of allSets) {
      for (const s of entry.sets) {
        if (s.pendingSync) count += 1;
      }
    }
    return count;
  }, [allSets]);

  // NOTE (BUG-EF-131): removed mount-time started_at write. The only correct
  // path to mark a session in-progress is markSessionInProgress() in the
  // set-logs POST route — called after the first set is actually logged, not
  // when the screen is opened.

  // ── Debounced exercise notes save (bug fix #1) ─────────────────
  const persistExerciseNotes = useCallback(
    (notes: Record<string, string>) => {
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
      notesDebounceRef.current = setTimeout(() => {
        fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data_merge: { exercise_notes: notes } }),
        })
          .then((res) => {
            if (!res.ok) {
              res.json().then((b) => b?.error).catch(() => null).then((msg) => {
                toast.error(msg || "Couldn't save exercise note");
              });
            }
          })
          .catch(() => {});
      }, 800);
    },
    [sessionId],
  );

  // ── Persist prescription changes (add-set / group / ungroup) ───
  // Structural edits (adding a set, grouping/ungrouping exercises) mutate the
  // relevant Exercise object in place (same object graph as dataRef.current,
  // since `sections` is a live reference into data.versions[version]), then
  // call this to write the whole session `data` blob back — otherwise the
  // change only lives in memory and silently reverts on the next page load,
  // even though any set_logs rows already saved against it stay in the DB.
  const persistPrescription = useCallback(() => {
    // CR-EF-121 — warn on superset set-count drift before persisting
    for (const sec of SECTION_DEFS) {
      const list = sections[sec.key] || [];
      if (list.length < 2) continue;
      const warnings = checkSupersetSetCounts(list);
      for (const w of warnings) {
        const detail = w.exercises.map((e) => `${e.name} (${e.sets})`).join(", ");
        toast.warning(
          `Superset ${w.label} in ${sec.label}: exercises have ${w.maxSets} rounds but some are set to fewer sets — later rounds will be incomplete. (${detail})`,
          { duration: 8000 },
        );
      }
    }

    const d = dataRef.current;
    if (!d) return;
    fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: d }),
    })
      .then((res) => {
        if (!res.ok) {
          res.json().then((b) => b?.error).catch(() => null).then((msg) => {
            toast.error(msg || "Failed to save — this change may not survive a reload.");
          });
        }
      })
      .catch(() => {
        toast.error("Failed to save — this change may not survive a reload.");
      });
  }, [sessionId]);

  // ── Rest alert audio (CR-EF-019) ────────────────────────────────
  // iOS PWAs block un-gestured audio, so the AudioContext is primed on the
  // user's "start rest" tap and the beep is generated in code (no asset, so it
  // works offline). navigator.vibrate is the silent-mode fallback.
  const primeRestAudio = useCallback(() => {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {
      /* audio unsupported — vibrate fallback still applies */
    }
  }, []);

  const playRestAlert = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "running") {
        const now = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 880;
          const t = now + i * 0.28;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
          osc.start(t);
          osc.stop(t + 0.26);
        }
      }
    } catch {
      /* ignore */
    }
    try {
      if ("vibrate" in navigator) navigator.vibrate([180, 90, 180]);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Rest timer interval ────────────────────────────────────────
  useEffect(() => {
    const running = Object.keys(restTimers).length > 0;
    if (running && !tickRef.current) {
      tickRef.current = setInterval(() => {
        setRestTimers((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            next[key] = { ...next[key], elapsed: next[key].elapsed + 1 };
          }
          return next;
        });
      }, 1000);
    } else if (!running && tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [restTimers]);

  // Fire the audible/vibrate alert the moment a countdown crosses zero
  // (CR-EF-019). alertedRef guarantees it fires once per countdown, not once
  // per remaining tick while the "over" state is shown.
  useEffect(() => {
    for (const [key, t] of Object.entries(restTimers)) {
      if (t.mode === "countdown" && t.elapsed >= t.seconds && !alertedRef.current.has(key)) {
        alertedRef.current.add(key);
        playRestAlert();
      }
    }
  }, [restTimers, playRestAlert]);

  // ── Set-log API ────────────────────────────────────────────────
  const handleSetDone = async (uid: string, setIdx: number) => {
    const state = exStates[uid];
    if (!state) return;
    const setNumber = setIdx + 1;
    const set = state.sets[setIdx];
    const ex = findExerciseByUid(uid);
    if (!ex) return;
    const timeBased = isTimeBased(ex.reps, ex.log_type);
    const ref = findExerciseRef(uid);
    if (!ref) return;

    let newStatus: "pending" | "done";
    let reps = set.reps;
    let weight = set.weight;
    let duration = set.duration;

    if (set.status === "done") {
      newStatus = "pending";
    } else {
      newStatus = "done";
      if (timeBased && !duration) {
        const presc = parsePrescribedSeconds(ex.reps);
        duration = presc != null ? String(presc) : ex.reps || "";
      }
      if (!timeBased && !reps) {
        const presc = parsePrescribedReps(ex.reps);
        reps = presc != null ? String(presc) : "";
      }
    }

    const result = await saveSetLog(sessionId, ref, setNumber, { reps, weight, duration }, newStatus === "done", set.isWarmup, state.displayUnit, setLogsMap, set.clientOpId);
    if (result.kind === "failed") {
      toast.error(result.message || "Failed to save set");
      return;
    }

    setExStates((prev) => {
      const st = prev[uid];
      if (!st) return prev;
      const newSets = [...st.sets];
      if (result.kind === "saved") {
        newSets[setIdx] = {
          status: newStatus,
          reps,
          weight,
          duration,
          savedId: result.log.id,
          isNewPb: result.log.is_new_pb === true,
          isWarmup: newSets[setIdx].isWarmup,
          pendingSync: false,
          clientOpId: undefined,
        };
      } else {
        // saved-but-queued: never a PB pill (client can't know cross-session history),
        // and no savedId yet — the row doesn't exist on the server.
        newSets[setIdx] = {
          status: newStatus,
          reps,
          weight,
          duration,
          isWarmup: newSets[setIdx].isWarmup,
          pendingSync: newStatus !== "pending",
          clientOpId: result.clientOpId,
        };
      }
      return { ...prev, [uid]: { ...st, sets: newSets } };
    });
  };

  const handleSetSkip = async (uid: string, setIdx: number) => {
    const state = exStates[uid];
    if (!state) return;
    const setNumber = setIdx + 1;
    const set = state.sets[setIdx];
    const ex = findExerciseByUid(uid);
    if (!ex) return;
    const timeBased = isTimeBased(ex.reps, ex.log_type);
    const ref = findExerciseRef(uid);
    if (!ref) return;

    const newStatus = set.status === "skipped" ? "pending" : "skipped";
    const reps = timeBased ? "" : (set.reps || "");
    const weight = timeBased ? "" : (set.weight || "");
    const duration = timeBased ? (set.duration || "") : "";

    const result = await saveSetLog(sessionId, ref, setNumber, { reps, weight, duration }, false, set.isWarmup, state.displayUnit, setLogsMap, set.clientOpId);
    if (result.kind === "failed") {
      toast.error(result.message || "Failed to save set");
      return;
    }

    setExStates((prev) => {
      const st = prev[uid];
      if (!st) return prev;
      const newSets = [...st.sets];
      newSets[setIdx] = {
        ...newSets[setIdx],
        status: newStatus,
        savedId: result.kind === "saved" ? result.log.id : newSets[setIdx].savedId,
        isNewPb: result.kind === "saved" ? result.log.is_new_pb === true : newSets[setIdx].isNewPb,
        pendingSync: result.kind === "queued" ? newStatus !== "pending" : false,
        clientOpId: result.kind === "queued" ? result.clientOpId : undefined,
      };
      return { ...prev, [uid]: { ...st, sets: newSets } };
    });
  };

  const handleSetField = (uid: string, setIdx: number, field: "reps" | "weight" | "duration", value: string) => {
    setExStates((prev) => {
      const st = prev[uid];
      if (!st) return prev;
      const newSets = [...st.sets];
      newSets[setIdx] = { ...newSets[setIdx], [field]: value };
      return { ...prev, [uid]: { ...st, sets: newSets } };
    });
  };

  const handleAddSet = (uid: string) => {
    const ex = findExerciseByUid(uid);
    if (!ex) return;
    const timeBased = isTimeBased(ex.reps, ex.log_type);
    // Bump the prescribed count too (not just the local set list) — otherwise
    // this set, and any log saved against it, disappears from view on reload
    // even though the set_logs row itself is still there.
    ex.sets = (ex.sets || 0) + 1;
    setExStates((prev) => {
      const st = prev[uid];
      if (!st) return prev;
      const newSets = [...st.sets];
      newSets.push({
        status: "pending",
        reps: timeBased ? "" : String(leadNum(ex.reps) || ""),
        weight: "",
        duration: timeBased ? ex.reps : "",
        isWarmup: false,
      });
      return { ...prev, [uid]: { ...st, sets: newSets } };
    });
    persistPrescription();
    toast(`Set ${exStates[uid]?.sets ? (exStates[uid].sets.length + 1) : 1} added to "${ex.exercise_name}".`);
  };

  const handleNoteToggle = (uid: string) => {
    setExStates((prev) => {
      const st = prev[uid];
      if (!st) return prev;
      return { ...prev, [uid]: { ...st, noteOpen: !st.noteOpen } };
    });
  };

  const handleNoteInput = (uid: string, value: string) => {
    savedNotesRef.current[uid] = value;
    setExStates((prev) => {
      const st = prev[uid];
      if (!st) return prev;
      return { ...prev, [uid]: { ...st, note: value } };
    });
    persistExerciseNotes(savedNotesRef.current);
  };

  const handleSwapUnit = (uid: string) => {
    const ex = findExerciseByUid(uid);
    if (!ex) return;
    // Bands always log in lb — the unit is locked, not just defaulted.
    if (isBandEquipment(ex.equipment ?? [])) return;
    setExStates((prev) => {
      const st = prev[uid];
      if (!st) return prev;
      const newUnit: "kg" | "lb" = st.displayUnit === "kg" ? "lb" : "kg";
      return { ...prev, [uid]: { ...st, displayUnit: newUnit } };
    });
    toast(`"${ex.exercise_name}" now logs in ${exStates[uid]?.displayUnit === "kg" ? "lb" : "kg"} for this session only.`);
  };

  // ── Rest timer actions ─────────────────────────────────────────
  const handleRestOpen = (key: string, seconds: number) => {
    primeRestAudio();
    setRestTimers((prev) => ({
      ...prev,
      [key]: { mode: "countdown", elapsed: 0, seconds },
    }));
  };

  const handleRestMode = (key: string, mode: "countdown" | "stopwatch") => {
    setRestTimers((prev) => {
      const t = prev[key];
      if (!t) return prev;
      return { ...prev, [key]: { ...t, mode, elapsed: 0 } };
    });
  };

  const handleRestReset = (key: string) => {
    alertedRef.current.delete(key);
    setRestTimers((prev) => {
      const t = prev[key];
      if (!t) return prev;
      return { ...prev, [key]: { ...t, elapsed: 0 } };
    });
  };

  const handleRestStop = (key: string) => {
    alertedRef.current.delete(key);
    setRestTimers((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // In-session rest-time override (CR-EF-020). Before the timer starts the
  // adjustment is remembered per-exercise (floored at 5s); while a countdown is
  // running it shifts the remaining time directly. Nothing is written back to
  // the prescription — this is for this session only.
  const handleRestAdjust = (key: string, delta: number, fallbackSeconds: number) => {
    if (restTimers[key]) {
      setRestTimers((prev) => {
        const t = prev[key];
        if (!t) return prev;
        return { ...prev, [key]: { ...t, elapsed: Math.max(0, t.elapsed - delta) } };
      });
    } else {
      setRestOverrides((prev) => {
        const base = prev[key] ?? fallbackSeconds;
        return { ...prev, [key]: Math.max(5, base + delta) };
      });
    }
  };

  // ── Pick (superset grouping) ───────────────────────────────────
  const handlePickMode = (sectionKey: SectionKey) => {
    setPickSection((prev) => (prev === sectionKey ? null : sectionKey));
    setPicked({});
  };

  const handlePickToggle = (uid: string) => {
    setPicked((prev) => {
      if (prev[uid]) {
        const next = { ...prev };
        delete next[uid];
        return next;
      }
      return { ...prev, [uid]: true };
    });
  };

  const handlePickCancel = () => {
    setPickSection(null);
    setPicked({});
  };

  const handlePickGroup = () => {
    const pickedUids = Object.keys(picked);
    if (pickedUids.length < 2 || !pickSection) return;

    const sectionList = sections[pickSection] || [];
    const label = nextGroupLabel(sectionList);

    setExStates((prev) => {
      for (const uid of pickedUids) {
        const st = prev[uid];
        if (!st) continue;
        const ex = findExerciseByUid(uid);
        if (!ex) continue;
        ex.group_label = label;
      }
      return { ...prev };
    });

    setPickSection(null);
    setPicked({});
    persistPrescription();
    toast(`${pickedUids.length} exercises grouped as ${label}.`);
  };

  const handleUngroup = (groupLabel: string) => {
    const allExs: Exercise[] = [];
    for (const sec of SECTION_DEFS) {
      for (const ex of sections[sec.key] || []) {
        allExs.push(ex);
      }
    }
    for (const ex of allExs) {
      if (ex.group_label === groupLabel) {
        ex.group_label = undefined;
      }
    }
    toast(`Superset ${groupLabel} ungrouped — the exercises stay in place, performed one at a time.`);
    setExStates((prev) => ({ ...prev }));
    persistPrescription();
  };

  // ── Quick session note (CR-EF-079) ─────────────────────────────
  const handleSaveNote = async () => {
    const text = noteDraft.trim();
    if (!text || !clientId) {
      toast.error("Cannot save note — client is not loaded.");
      return;
    }

    // BUG-EF-107 — if the text hasn't changed since the last save (or initial
    // load), just close the sheet without hitting the API.
    if (lastSavedNoteText !== null && text === lastSavedNoteText) {
      setNoteOpen(false);
      toast("No changes");
      return;
    }

    setNoteSaving(true);
    try {
      let res: Response;
      if (savedNoteId) {
        res = await fetch(`/api/client-notes/${savedNoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: text }),
        });
      } else {
        res = await fetch("/api/client-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, session_id: sessionId, note: text }),
        });
      }
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json().catch(() => null);
      setNoteOpen(false);
      setLastSavedNoteText(text);
      setSavedNoteId(saved?.id ?? savedNoteId ?? null);
      toast.success("Note saved");
    } catch {
      toast.error("Could not save note — try again.");
    } finally {
      setNoteSaving(false);
    }
  };

  // ── Complete ───────────────────────────────────────────────────
  const handleComplete = async (offDay?: { mode: "today" | "booked"; scheduledAt: string }) => {
    if (completing) return; // idempotent: ignore double-tap while in flight
    setCompleting(true);
    const d = dataRef.current;
    if (!d) return;

    const mergePatch: Record<string, unknown> = {
      session_log: {
        completed_at:
          offDay?.mode === "booked" ? offDay.scheduledAt : new Date().toISOString(),
        started_at: sessionLogRef.current?.started_at ?? null,
        rpe,
        fatigue,
        notes: sessionNotes,
      },
      exercise_notes: savedNotesRef.current,
    };
    const body: Record<string, unknown> = { data_merge: mergePatch };
    if (offDay) {
      body.confirm_off_day = true;
      body.off_day_mode = offDay.mode;
    }

    // Offline fallback: persist a pending-completion record so the UI can
    // lock into the completed state immediately and drain when online.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const clientOpId = await stableSetOpId(sessionId, "__completion__", 0);
      try {
        await enqueueCompletion({
          kind: "completion",
          client_op_id: clientOpId,
          sessionId,
          body,
          queuedAt: new Date().toISOString(),
        });
      } catch {
        setCompleting(false);
        toast.error("Could not save completion — storage may be full.");
        return;
      }
      // Lock UI into completed state immediately.
      const offlineLog: SessionLog = {
        completed_at: body.session_log && typeof body.session_log === "object"
          ? (body.session_log as Record<string, unknown>).completed_at as string
          : new Date().toISOString(),
        started_at: sessionLogRef.current?.started_at ?? null,
        rpe,
        fatigue,
        notes: sessionNotes,
      };
      dataRef.current = { ...d, session_log: offlineLog, exercise_notes: savedNotesRef.current };
      sessionLogRef.current = offlineLog;
      setShowComplete(false);
      setCompleting(false);
      try { localStorage.removeItem(`ef-session-draft:${sessionId}`); } catch { /* ignore */ }
      setOffline(true);
      setSyncNotice("Completed — will sync when back online");
      return;
    }

    const result = await completeSession(sessionId, {
      rpe,
      fatigue,
      notes: sessionNotes,
      startedAt: sessionLogRef.current?.started_at ?? null,
      exerciseNotes: savedNotesRef.current,
      offDay,
    });

    setCompleting(false);

    if (result.kind === "off_day") {
      if (!window.confirm(`This session is booked for ${result.scheduledDateLabel}, not today. Complete it anyway?`)) {
        return;
      }
      const onBookedDay = window.confirm(
        `Did it happen on ${result.scheduledDateLabel}?

OK — record it on ${result.scheduledDateLabel} (logging from paper)
Cancel — record it as today`,
      );
      return handleComplete({
        mode: onBookedDay ? "booked" : "today",
        scheduledAt: result.scheduledAt,
      });
    }

    if (result.kind === "already_completed") {
      setShowComplete(false);
      try { localStorage.removeItem(`ef-session-draft:${sessionId}`); } catch { /* ignore */ }
      toast.success(`Session ${sessionNumber} marked complete.`);
      return;
    }

    if (result.kind === "error") {
      // Network error after online check — queue for retry.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const clientOpId = await stableSetOpId(sessionId, "__completion__", 0);
        try {
          await enqueueCompletion({
            kind: "completion",
            client_op_id: clientOpId,
            sessionId,
            body,
            queuedAt: new Date().toISOString(),
          });
        } catch {
          toast.error("Could not save completion — storage may be full.");
          return;
        }
        const offlineLog: SessionLog = {
          completed_at: new Date().toISOString(),
          started_at: sessionLogRef.current?.started_at ?? null,
          rpe,
          fatigue,
          notes: sessionNotes,
        };
        dataRef.current = { ...d, session_log: offlineLog, exercise_notes: savedNotesRef.current };
        sessionLogRef.current = offlineLog;
        setShowComplete(false);
        try { localStorage.removeItem(`ef-session-draft:${sessionId}`); } catch { /* ignore */ }
        setOffline(true);
        setSyncNotice("Completed — will sync when back online");
        return;
      }
      toast.error(result.message);
      return;
    }

    // success
    dataRef.current = { ...d, session_log: result.updatedLog, exercise_notes: savedNotesRef.current };
    sessionLogRef.current = result.updatedLog;
    setShowComplete(false);
    // BUG-EF-135 — clear the localStorage draft on successful completion.
    try { localStorage.removeItem(`ef-session-draft:${sessionId}`); } catch { /* ignore */ }
    // Post-complete message: look up the next scheduled session today
    fetch(`/api/sessions/today-next?exclude=${sessionId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((next) => {
        if (next?.clientName && next?.time) {
          toast.success(`Done — next up: ${next.clientName} at ${next.time}`);
        } else {
          toast.success("Done — that's the last session today.");
        }
      })
      .catch(() => {
        toast.success(`Session ${sessionNumber} marked complete.`);
      });
  };

  // ── Uid → exercise / exercise_ref lookup ───────────────────────
  const uidToRefMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const sec of SECTION_DEFS) {
      (sections[sec.key] || []).forEach((ex, idx) => {
        if (ex.uid) {
          map.set(ex.uid, exerciseRefKey(version, sec.key, idx, ex.exercise_name));
        }
      });
    }
    return map;
  }, [sections, version]);

  const uidToExMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const sec of SECTION_DEFS) {
      for (const ex of sections[sec.key] || []) {
        if (ex.uid) map.set(ex.uid, ex);
      }
    }
    return map;
  }, [sections]);

  const findExerciseRef = useCallback((uid: string) => uidToRefMap.get(uid) ?? null, [uidToRefMap]);
  const findExerciseByUid = useCallback((uid: string) => uidToExMap.get(uid) ?? null, [uidToExMap]);

  // ── BUG-EF-135: Deploy tolerance ────────────────────────────────
  // If a chunk-load failure (stale JS after a deploy) fires during an active
  // session, reload the same URL rather than dumping the trainer to the root.
  // Guarded by sessionStorage so the reload itself doesn't loop.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyReloaded = sessionStorage.getItem("ef-chunk-reload");
    if (alreadyReloaded) return;

    function isChunkError(e: Event | PromiseRejectionEvent): boolean {
      const msg = e instanceof PromiseRejectionEvent
        ? (e.reason?.message ?? String(e.reason))
        : e instanceof ErrorEvent
          ? (e.message ?? "")
          : "";
      return /chunk|loading chunk|dynamic import|import\(\)|script.*error/i.test(msg);
    }

    function handler(e: Event | PromiseRejectionEvent) {
      if (!isChunkError(e)) return;
      try { sessionStorage.setItem("ef-chunk-reload", "1"); } catch { /* ignore */ }
      location.replace(location.href);
    }

    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", handler);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", handler);
    };
  }, []);

  // BUG-EF-135 — clear the chunk-reload flag after the page has fully loaded,
  // so the *next* chunk error (e.g. from a second deploy) can trigger a reload.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { sessionStorage.removeItem("ef-chunk-reload"); } catch { /* ignore */ }
  }, []);

  // ── Offline queue replay ───────────────────────────────────────
  // Reconciles one replayed write back into the in-memory set state: queued →
  // synced. Full reconciliation from the server response so a set that was queued
  // before a reload (and so had no server row at init time) still lands correct.
  const markSetSynced = useCallback(
    (entry: PendingSetLogEntry, data: SetLog & { is_new_pb?: boolean }) => {
      setExStates((prev) => {
        let targetUid: string | null = null;
        for (const [uid, ref] of uidToRefMap) {
          if (ref === entry.exerciseRef) {
            targetUid = uid;
            break;
          }
        }
        if (!targetUid) return prev;
        const st = prev[targetUid];
        if (!st) return prev;
        const setIdx = entry.setNumber - 1;
        if (setIdx < 0 || setIdx >= st.sets.length) return prev;
        const newSets = [...st.sets];
        const unit = st.displayUnit;
        newSets[setIdx] = {
          ...newSets[setIdx],
          status: data.completed ? "done" : "skipped",
          reps: data.reps != null ? String(data.reps) : "",
          weight: data.weight_kg != null ? displayWeight(data.weight_kg, unit) : "",
          duration: data.duration_seconds != null ? String(data.duration_seconds) : "",
          savedId: data.id,
          isNewPb: data.is_new_pb === true,
          pendingSync: false,
          clientOpId: undefined,
        };
        setLogsMap[`${entry.exerciseRef}::${entry.setNumber}`] = data;
        return { ...prev, [targetUid]: { ...st, sets: newSets } };
      });
    },
    [uidToRefMap, setLogsMap],
  );

  const drainQueue = useCallback(async () => {
    const result = await drainSetLogQueue(markSetSynced);

    if (result.authError) {
      setSyncNotice(`Sign in to sync ${result.remainingPending} logged ${result.remainingPending === 1 ? "set" : "sets"}`);
      return;
    }

    if (result.synced > 0 || result.completionsDrained > 0) {
      setSyncNotice(null);
      if (result.synced > 0) {
        toast.success(
          `${result.synced} ${result.synced === 1 ? "set" : "sets"} synced${result.newPbs > 0 ? ` — ${result.newPbs} new PB` : ""}`,
        );
      }
      if (result.completionsDrained > 0) {
        toast.success("Session completion synced.");
      }
    }
  }, [markSetSynced]);

  // Drain once on mount (entries may persist in IndexedDB across a reload from a
  // prior offline period) and again whenever connectivity returns.
  useEffect(() => {
    // Sync initial online state — navigator.onLine may differ from the
    // server's hardcoded `false` (e.g. mobile reports offline briefly on
    // first load), so we correct it after hydration to avoid a flash.
    setOffline(!navigator.onLine);

    const onOnline = () => {
      setOffline(false);
      void drainQueue();
    };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [drainQueue]);

  useEffect(() => {
    void drainQueue();
  }, [drainQueue]);

  // ── BUG-EF-135: Draft persistence ───────────────────────────────
  // Saves un-submitted field state (pending set values + session summary)
  // to localStorage keyed by session id, debounced at 500 ms. Only pending
  // sets are captured — completed/skipped sets already have server-side data.
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftSessionIdRef = useRef(sessionId);
  const draftExStatesRef = useRef(exStates);
  const draftRpeRef = useRef(rpe);
  const draftFatigueRef = useRef(fatigue);
  const draftSessionNotesRef = useRef(sessionNotes);
  draftExStatesRef.current = exStates;
  draftRpeRef.current = rpe;
  draftFatigueRef.current = fatigue;
  draftSessionNotesRef.current = sessionNotes;

  useEffect(() => {
    return () => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => {
      try {
        const setsDraft: Record<string, { reps?: string; weight?: string; duration?: string }> = {};
        const st = draftExStatesRef.current;
        for (const uid of Object.keys(st)) {
          const exSets = st[uid].sets;
          const pending = exSets.filter((s) => s.status === "pending");
          if (pending.length === 0) continue;
          // Use the first pending set's values (all pending sets for this exercise
          // share the same prefill — the draft captures the current field values).
          const first = pending[0];
          setsDraft[uid] = {
            ...(first.reps !== "" ? { reps: first.reps } : {}),
            ...(first.weight !== "" ? { weight: first.weight } : {}),
            ...(first.duration !== "" ? { duration: first.duration } : {}),
          };
        }
        const summaryDraft = {
          ...(draftRpeRef.current != null ? { rpe: draftRpeRef.current } : {}),
          ...(draftFatigueRef.current != null ? { fatigue: draftFatigueRef.current } : {}),
          ...(draftSessionNotesRef.current ? { sessionNotes: draftSessionNotesRef.current } : {}),
        };
        const draft = {
          ...(Object.keys(setsDraft).length > 0 ? { sets: setsDraft } : {}),
          ...(Object.keys(summaryDraft).length > 0 ? { summary: summaryDraft } : {}),
        };
        if (Object.keys(draft).length > 0) {
          localStorage.setItem(`ef-session-draft:${draftSessionIdRef.current}`, JSON.stringify(draft));
        } else {
          localStorage.removeItem(`ef-session-draft:${draftSessionIdRef.current}`);
        }
      } catch { /* storage full or unavailable — skip silently */ }
    }, 500);
  });

  // ── Exercise-complete check ─────────────────────────────────────
  const exComplete = useCallback(
    (uid: string): boolean => {
      const st = exStates[uid];
      if (!st) return false;
      return st.sets.length > 0 && st.sets.every((s) => s.status !== "pending");
    },
    [exStates],
  );

  // ── Render helpers ─────────────────────────────────────────────
  const topStatusLabel = progress.doneExCount === allSets.length
    ? "All logged"
    : progress.started
      ? "In progress"
      : "Not started";

  const topStatusClass = progress.doneExCount === allSets.length
    ? "done"
    : progress.started
      ? "progress"
      : "pending";

  const secIconEl = (color: "teal" | "rose" | "navy") => {
    const cls = color === "teal" ? "ic-teal" : color === "rose" ? "ic-rose" : "ic-navy";
    const icon = color === "teal" ? ICO.flame : color === "rose" ? ICO.lightning : ICO.moon;
    return <div className={`sec-h-ic ${cls}`}>{icon}</div>;
  };

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="top">
        <div className="top-row">
          <Link
            className="back-btn"
            href="/hub/m"
            aria-label="Back to today"
          >
            {ICO.back}
          </Link>
          <div className="top-id">
            <div className="top-client">{clientName}</div>
            <div className="top-meta">
              {sessionWorkoutName({ archetype, data, week, phase }, `Session ${sessionNumber}`)}
              {` · ${phase}`}
              {scheduledAt ? ` · ${new Date(scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : hasProgram && week != null ? ` · Wk ${week}` : ""}
            </div>
          </div>
          <span className={`top-status ${topStatusClass}`}>{topStatusLabel}</span>
          {!sessionCompleted && (
            <button
              type="button"
              className="swap-btn"
              onClick={() => setSwapOpen(true)}
            >
              Swap ›
            </button>
          )}
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress.pct}%` }} />
        </div>
        <div className="progress-row">
          <span className="progress-label">{progress.doneExCount} of {allSets.length} exercises logged</span>
          <span className="eta" title="A guide from the prescription — not a live countdown">
            {ICO.clock}~{durationMinutes} min · guide
          </span>
        </div>
      </header>

      {/* ── Offline / sync bar ──────────────────────────────────── */}
      {(offline || syncNotice) && (
        <div className="offline on" id="offlineBar" role="status">
          <span className="offline-ic">{ICO.rest}</span>
          <div>
            {syncNotice ? (
              <b>{syncNotice}</b>
            ) : (
              <>
                <b>Offline — sets saved on this phone</b>
                Keep logging. Everything is queued locally and syncs the moment the signal comes back. The desktop hub won&apos;t see these sets until then.
              </>
            )}
          </div>
          <button className="offline-act" onClick={() => void drainQueue()}>Retry</button>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="mcontent" style={{ paddingBottom: "calc(var(--tabbar-h) + 66px + 24px + env(safe-area-inset-bottom))" }}>
        <div className="note">
          <span className="note-b">i</span>
          <div>
            <b>The real-time session screen.</b> Replaces the old desktop-adjacent log.
            Fields are pre-filled from the prescription — tap <b>Done</b> to log exactly as prescribed, or edit first.
          </div>
        </div>

        <div id="sectionsRoot">
          {pendingCount > 0 && (
            <div className="pending-sync-line" role="status" style={{ padding: "6px 12px", marginBottom: 8, background: offline ? "rgba(2,48,71,.04)" : "rgba(33,158,188,.06)", borderRadius: 8, fontSize: 12, color: "var(--muted, #6b7280)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: offline ? "#f59e0b" : "#219EBC", flexShrink: 0 }} />
              {offline
                ? <>{pendingCount} set{pendingCount !== 1 ? "s" : ""} saved on this phone — syncing when back online</>
                : <>{pendingCount} syncing…</>
              }
            </div>
          )}
          {SECTION_DEFS.map((sec) => {
            const list = sections[sec.key] || [];
            const blocks = computeGroups(list);
            const isCollapsed = !!collapsed[sec.key];
            const inPick = pickSection === sec.key;
            const doneCount = list.filter((ex) => ex.uid && exComplete(ex.uid)).length;

            return (
              <div key={sec.key} className={`sec${isCollapsed ? " collapsed" : ""}`}>
                <button
                  type="button"
                  className="sec-h"
                  onClick={() => setCollapsed((p) => ({ ...p, [sec.key]: !p[sec.key] }))}
                  aria-expanded={!isCollapsed}
                >
                  {secIconEl(sec.color)}
                  <div>
                    <div className="sec-h-t">{sec.label}</div>
                    <div className="sec-h-s">{doneCount} of {list.length} logged</div>
                  </div>
                  <span className="sec-h-chev">{ICO.chev}</span>
                </button>

                {sec.key === "main_block" && (
                  <div className="sec-tools">
                    <button
                      type="button"
                      className={`tool-btn${inPick ? " on" : ""}`}
                      onClick={() => handlePickMode(sec.key)}
                      aria-pressed={inPick}
                    >
                      {ICO.link}
                      {inPick ? "Selecting" : "Group"}
                    </button>
                    <span className="tool-hint">
                      {inPick ? "Tick two or more, then confirm below." : "Combine exercises into a superset."}
                    </span>
                  </div>
                )}

                {!isCollapsed && (
                  <div className="sec-b">
                    {blocks.map((block) =>
                      block.type === "group" ? (
                        <SupersetBlock
                          key={`grp-${block.label}`}
                          block={block as { type: "group"; label?: string; items: Exercise[] }}
                          exStates={exStates}
                          inPick={inPick}
                          picked={picked}
                          restTimers={restTimers}
                          restOverrides={restOverrides}
                          onSetDone={handleSetDone}
                          onSetSkip={handleSetSkip}
                          onSetField={handleSetField}
                          onNoteToggle={handleNoteToggle}
                          onNoteInput={handleNoteInput}
                          onSwapUnit={handleSwapUnit}
                          onAddSet={handleAddSet}
                          onPickToggle={handlePickToggle}
                          onRestOpen={handleRestOpen}
                          onRestMode={handleRestMode}
                          onRestReset={handleRestReset}
                          onRestStop={handleRestStop}
                          onRestAdjust={handleRestAdjust}
                          onUngroup={handleUngroup}
                          exComplete={exComplete}
                          sessionCompleted={sessionCompleted}
                        />
                      ) : (
                        <ExerciseCard
                          key={block.items[0].uid ?? block.items[0].exercise_name}
                          sessionId={sessionId}
                          exercise={block.items[0]}
                          state={exStates[block.items[0].uid ?? ""]}
                          restTimerKey={block.items[0].uid ?? ""}
                          restTimer={restTimers[block.items[0].uid ?? ""]}
                          restSeconds={parseRestSeconds(block.items[0].rest ?? "") ?? 60}
                          restOverride={restOverrides[block.items[0].uid ?? ""]}
                          inPick={inPick}
                          isPicked={!!(block.items[0].uid && picked[block.items[0].uid])}
                          onSetDone={handleSetDone}
                          onSetSkip={handleSetSkip}
                          onSetField={handleSetField}
                          onNoteToggle={handleNoteToggle}
                          onNoteInput={handleNoteInput}
                          onSwapUnit={handleSwapUnit}
                          onAddSet={handleAddSet}
                          onPickToggle={handlePickToggle}
                          onRestOpen={handleRestOpen}
                          onRestMode={handleRestMode}
                          onRestReset={handleRestReset}
                          onRestStop={handleRestStop}
                          onRestAdjust={handleRestAdjust}
                          isComplete={block.items[0].uid ? exComplete(block.items[0].uid) : false}
                          sessionCompleted={sessionCompleted}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Session summary ──────────────────────────────────────── */}
        <div className="summary">
          <h2>Session summary</h2>
          <p>Logged once, at the end — covers how the whole session felt, not one exercise.</p>

          <div className="field-group">
            <span className="field-l">
              RPE <span className="field-hint">— rate of perceived exertion, 1 (very light) – 10 (maximal)</span>
            </span>
            <div className="rpe-row" role="radiogroup" aria-label="RPE">
              {Array.from({ length: 10 }, (_, i) => {
                const val = i + 1;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRpe(rpe === val ? null : val)}
                    className={`rpe-btn${rpe === val ? " on" : ""}`}
                    aria-pressed={rpe === val}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field-group">
            <span className="field-l">Fatigue level</span>
            <div className="fatigue-seg" role="radiogroup" aria-label="Fatigue level">
              {(["low", "moderate", "high"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFatigue(fatigue === f ? null : f)}
                  className={`fatigue-btn ${f}${fatigue === f ? " on" : ""}`}
                  aria-pressed={fatigue === f}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <span className="field-l">Session notes</span>
            <div className="notes-row">
              <textarea
                id="sessionNotes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="How did the session go overall — anything to flag for next time?"
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Pick bar ─────────────────────────────────────────────── */}
      <div className={`pick-bar${pickSection ? " on" : ""}`}>
        <div className="pick-count">
          {Object.keys(picked).length} selected
          <span>Pick two or more from the same section</span>
        </div>
        <button onClick={handlePickCancel}>Cancel</button>
        <button
          className="go"
          onClick={handlePickGroup}
          disabled={Object.keys(picked).length < 2}
        >
          Group as superset
        </button>
      </div>

      {/* ── CR-EF-169: Supplementary sub-sessions ────────────────── */}
      {subSessions && subSessions.length > 0 && (
        <div className="sub-sessions" style={{ padding: "16px 16px 0" }}>
          <div className="sub-sessions-header" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "10px 12px", background: "var(--rose-bg, rgba(193,131,159,.08))", borderRadius: 10, border: "1px solid var(--rose-border, rgba(193,131,159,.2))" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--rose, #c1839f)" }}>Also in this session</span>
            <span style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>+{subSessions.length} supplementary</span>
          </div>
          {subSessions.map((sub) => (
            <Link
              key={sub.id}
              href={`/hub/m/train/${sub.id}`}
              className="sub-session-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                marginBottom: 6,
                background: "var(--card, #fff)",
                border: "1px solid var(--border, #e5e7eb)",
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--rose, #c1839f)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{sub.exerciseCount} exercise{sub.exerciseCount !== 1 ? "s" : ""}</div>
              </div>
              <span style={{ fontSize: 11, color: "var(--teal, #14b8a6)", fontWeight: 600 }}>Open →</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Completed banner (Phase 2) ────────────────────────────── */}
      {sessionCompleted && (
        <div className="completed-banner">
          <span className="completed-banner-ic">{ICO.checkLg}</span>
          <div>
            <div className="completed-banner-t">
              Session completed{completedAt ? ` ${new Date(completedAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at ${new Date(completedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </div>
            <div className="completed-banner-s">
              {progress.doneExCount} of {allSets.length} exercises logged
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom action bar ─────────────────────────────────────── */}
      <div className="action-bar">
        <div className="action-inner">
          <Link
            className="btn btn-outline btn-icon"
            href={`/hub/m/train/${sessionId}/edit`}
            aria-label="Edit workout"
            title="Edit workout"
          >
            {ICO.edit}
          </Link>
          <button
            type="button"
            className={`btn btn-outline btn-icon${noteDraft.trim() ? " has-note" : ""}`}
            onClick={() => setNoteOpen(true)}
            aria-label="Add a note about this session"
            title="Add a note"
          >
            {ICO.note}
          </button>
          {!sessionCompleted && (
            <button
              type="button"
              className="btn btn-outline btn-icon"
              onClick={async () => {
                if (clientNumber == null) return;
                try {
                  const res = await fetch(`/api/clients/${clientNumber}/pot-ledger`);
                  const data = await res.json();
                  setMoveCancelData({
                    allSessions: data.sessions ?? [],
                    sessionsPurchased: data.consumption?.purchased ?? null,
                  });
                } catch {
                  setMoveCancelData({ allSessions: [], sessionsPurchased: null });
                }
                setMoveCancelOpen(true);
              }}
              aria-label="Move or cancel this session"
              title="Move or cancel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <span className="action-scope">{progress.doneExCount} of {allSets.length} exercises logged</span>
          {sessionCompleted ? (
            <Link
              className="btn btn-outline"
              href={`/hub/m/train/${sessionId}/edit`}
              style={{ fontSize: 13 }}
            >
              Edit this session
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (rpe == null && fatigue == null) {
                  toast("Tip: RPE and fatigue are still blank — you can still complete without them.");
                }
                setShowComplete(true);
              }}
              disabled={completing}
            >
              {ICO.check}
              Complete
            </button>
          )}
        </div>
      </div>

      {/* ── Quick note sheet ──────────────────────────────────────── */}
      {noteOpen && (
        <>
          <div className="sheet-overlay open" onClick={() => setNoteOpen(false)} />
          <div className="note-sheet" role="dialog" aria-modal="true" aria-labelledby="noteSheetTitle">
            <div className="sh-grab" />
            <div className="sh-h">
              <span className="sh-t" id="noteSheetTitle">
                Note — {data?.focus_label || (archetype ? `${archetype} session` : `Session ${sessionNumber}`)}
              </span>
              <button className="sh-close" onClick={() => setNoteOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="sh-s">
              For {clientName} · same notes list she sees in client mode
            </div>
            <div className="sh-note">
              <textarea
                placeholder="Add a note about this session…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                aria-label="Note text"
              />
              <div className="sh-note-foot">
                <button className="btn btn-primary" onClick={handleSaveNote} disabled={noteSaving || !noteDraft.trim()}>
                  Save note
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Complete overlay ──────────────────────────────────────── */}
      {showComplete && (
        <div className="overlay open" onClick={() => setShowComplete(false)}>
          <div className="complete-card" onClick={(e) => e.stopPropagation()}>
            <div className="complete-ic">{ICO.checkLg}</div>
            <h3>Mark this session complete?</h3>
            <p>
              {progress.doneExCount === allSets.length
                ? "Every exercise is logged. This saves the session and marks it complete."
                : `${allSets.length - progress.doneExCount} of ${allSets.length} exercises are still unlogged. You can complete anyway — unlogged sets save as not recorded.`}
            </p>
            <div className="complete-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleComplete()}
                disabled={completing}
                style={{ width: "100%" }}
              >
                Yes, complete session
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowComplete(false)}
                style={{ width: "100%" }}
              >
                Keep logging
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 3: Swap workout sheet ──────────────────────────── */}
      {swapOpen && (
        <SwapChooser
          sessionId={sessionId}
          clientNumber={clientNumber}
          currentWorkoutName={sessionWorkoutName({ archetype, data, week, phase }, `Session ${sessionNumber}`)}
          hasProgram={hasProgram}
          onClose={() => setSwapOpen(false)}
          onSwapped={() => { setSwapOpen(false); router.refresh(); }}
        />
      )}

      {/* ── Phase 4: Move / Cancel sheet ─────────────────────────── */}
      {moveCancelOpen && moveCancelData && (
        <MoveCancelSheet
          session={{
            id: sessionId,
            scheduled_at: scheduledAt,
            block_id: "",
            session_number: sessionNumber,
            data,
            archetype,
            week,
            phase,
          }}
          clientName={clientName}
          clientNumber={clientNumber}
          allSessions={moveCancelData?.allSessions ?? []}
          onClose={() => setMoveCancelOpen(false)}
          onMoved={() => { setMoveCancelOpen(false); router.refresh(); }}
          onCancelled={() => { setMoveCancelOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function Thumbnail({ exercise }: { exercise: Exercise }) {
  const imageUrl = exercise.media?.image_url;
  if (imageUrl) {
    return (
      <div className="ex-thumb has-img" aria-hidden="true">
        <img
          src={imageUrl}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
      </div>
    );
  }
  if (exercise.media?.video_url) {
    return (
      <div className="ex-thumb has-img" aria-hidden="true">
        {ICO.video}
      </div>
    );
  }
  return (
    <div className="ex-thumb no-img" aria-hidden="true">
      {ICO.img}
      <span className="thumb-cap">none</span>
    </div>
  );
}

function SetRow({
  exercise,
  set,
  setIdx,
  displayUnit,
  onSetDone,
  onSetSkip,
  onSetField,
  onSwapUnit,
  readOnly,
}: {
  exercise: Exercise;
  set: SetState;
  setIdx: number;
  displayUnit: "kg" | "lb";
  onSetDone: (uid: string, setIdx: number) => void;
  onSetSkip: (uid: string, setIdx: number) => void;
  onSetField: (uid: string, setIdx: number, field: "reps" | "weight" | "duration", value: string) => void;
  onSwapUnit: (uid: string) => void;
  /** Phase 2 — when true, inputs are disabled and action buttons are hidden */
  readOnly?: boolean;
}) {
  const uid = exercise.uid ?? "";
  const timeBased = isTimeBased(exercise.reps, exercise.log_type);
  const disabled = readOnly || set.status === "skipped";
  const isBand = isBandEquipment(exercise.equipment ?? []);
  const targetLabel = timeBased
    ? `Target: ${exercise.reps}`
    : `Target: ${exercise.reps}${exercise.tempo && exercise.tempo !== "—" ? ` @ ${exercise.tempo}` : ""}${exercise.rest && exercise.rest !== "—" ? ` · ${exercise.rest} rest` : ""}`;

  const rowCls = [
    "set-row",
    set.status === "done" ? "is-done" : "",
    set.status === "skipped" ? "is-skipped" : "",
    set.isWarmup && set.status !== "done" && set.status !== "skipped" ? "is-warmup" : "",
    set.pendingSync ? "is-queued" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={rowCls}>
      <div className="set-row-top">
        <span className="set-n">{setIdx + 1}</span>
        {set.isWarmup && <span className="wu-badge">Warm-up</span>}
        <span className="set-target">{targetLabel}</span>
        {set.status === "done" && set.isNewPb && (
          <span className="log-badge reps" style={{ marginLeft: "auto" }}>New PB</span>
        )}
        {set.pendingSync && (
          <span className="queued-badge" style={{ marginLeft: "auto" }}>queued — will sync</span>
        )}
      </div>
      <div className="set-row-body">
        {timeBased ? (
          <div className="set-field wide">
            <span className="set-field-l">Duration</span>
            <input
              className="set-input"
              type="text"
              inputMode="numeric"
              value={set.duration}
              onChange={(e) => onSetField(uid, setIdx, "duration", e.target.value)}
              placeholder={exercise.reps}
              disabled={disabled}
            />
          </div>
        ) : (
          <>
            <div className="set-field">
              <span className="set-field-l">Reps</span>
              <input
                className="set-input"
                type="number"
                inputMode="numeric"
                value={set.reps}
                onChange={(e) => onSetField(uid, setIdx, "reps", e.target.value)}
                placeholder={parsePrescribedReps(exercise.reps) != null ? String(parsePrescribedReps(exercise.reps)) : exercise.reps}
                disabled={disabled}
              />
            </div>
            <div className="set-field">
              <span className="set-field-l">
                Weight ({displayUnit})
                {isBand ? (
                  <span className="unit-lock" title="Band exercises always log in lb — unit is locked">
                    bands
                  </span>
                ) : (
                  <button
                    className="unit-swap"
                    onClick={() => onSwapUnit(uid)}
                    title="Correct the unit for this exercise"
                  >
                    switch
                  </button>
                )}
              </span>
              {isBand ? (
                /* Bands are chosen, not typed: a fixed 5 lb ladder so the same
                   number means the same thing on every band Esther or the
                   client owns, whatever colour it happens to be. */
                <select
                  className="set-input"
                  value={snapBandLoadLb(set.weight) ?? ""}
                  onChange={(e) => onSetField(uid, setIdx, "weight", e.target.value)}
                  disabled={disabled}
                  aria-label="Band load in pounds"
                >
                  <option value="">—</option>
                  {bandLoadOptionsLb().map((lb) => (
                    <option key={lb} value={lb}>{lb} lb</option>
                  ))}
                </select>
              ) : (
                <input
                  className="set-input"
                  type="text"
                  inputMode="decimal"
                  value={set.weight}
                  onChange={(e) => onSetField(uid, setIdx, "weight", e.target.value)}
                  placeholder="BW"
                  disabled={disabled}
                />
              )}
            </div>
          </>
        )}
        {!readOnly && (
          <div className="set-actions">
            <button
              type="button"
              className={`set-btn done-btn${set.status === "done" ? " on" : ""}`}
              onClick={() => onSetDone(uid, setIdx)}
              aria-pressed={set.status === "done"}
            >
              {ICO.check}Done
            </button>
            <button
              type="button"
              className={`set-btn skip-btn${set.status === "skipped" ? " on" : ""}`}
              onClick={() => onSetSkip(uid, setIdx)}
              aria-pressed={set.status === "skipped"}
            >
              {ICO.skip}Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CondensedSetRow({
  exercise,
  set,
  setIdx,
  displayUnit,
  onSetDone,
  onSetSkip,
  onSetField,
  readOnly,
}: {
  exercise: Exercise;
  set: SetState;
  setIdx: number;
  displayUnit: "kg" | "lb";
  onSetDone: (uid: string, setIdx: number) => void;
  onSetSkip: (uid: string, setIdx: number) => void;
  onSetField: (uid: string, setIdx: number, field: "reps" | "weight" | "duration", value: string) => void;
  readOnly?: boolean;
}) {
  const uid = exercise.uid ?? "";
  const timeBased = isTimeBased(exercise.reps, exercise.log_type);
  const isBand = isBandEquipment(exercise.equipment ?? []);

  if (set.status === "done") {
    return (
      <div className="c-set done">
        <div className="c-receipt done">
          {"✓ Set "}{setIdx + 1}{" — "}{set.reps || "—"}{" reps · "}{set.weight || "BW"}
          {!readOnly && (
            <button className="c-edit" onClick={() => onSetDone(uid, setIdx)}>Edit</button>
          )}
        </div>
      </div>
    );
  }

  if (set.status === "skipped") {
    return (
      <div className="c-set">
        <div className="c-receipt skipped">
          {"✕ Set "}{setIdx + 1}{" — skipped"}
          {!readOnly && (
            <button className="c-edit" onClick={() => onSetSkip(uid, setIdx)}>Edit</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="c-set">
      <span className="c-sn">{setIdx + 1}</span>
      {timeBased ? (
        <input
          className="c-in"
          type="text"
          inputMode="numeric"
          value={set.duration}
          onChange={(e) => onSetField(uid, setIdx, "duration", e.target.value)}
          placeholder={exercise.reps}
          disabled={readOnly}
        />
      ) : (
        <input
          className="c-in"
          type="number"
          inputMode="numeric"
          value={set.reps}
          onChange={(e) => onSetField(uid, setIdx, "reps", e.target.value)}
          placeholder={parsePrescribedReps(exercise.reps) != null ? String(parsePrescribedReps(exercise.reps)) : exercise.reps}
          disabled={readOnly}
        />
      )}
      {!timeBased && (
        isBand ? (
          <select
            className="c-select"
            value={snapBandLoadLb(set.weight) ?? ""}
            onChange={(e) => onSetField(uid, setIdx, "weight", e.target.value)}
            disabled={readOnly}
          >
            <option value="">—</option>
            {bandLoadOptionsLb().map((lb) => (
              <option key={lb} value={lb}>{lb} lb</option>
            ))}
          </select>
        ) : (
          <input
            className="c-in"
            type="text"
            inputMode="decimal"
            value={set.weight}
            onChange={(e) => onSetField(uid, setIdx, "weight", e.target.value)}
            placeholder="BW"
            disabled={readOnly}
          />
        )
      )}
      {!readOnly && (
        <div className="c-acts">
          <button type="button" className="c-ok" onClick={() => onSetDone(uid, setIdx)}>
            {ICO.checkSm}
          </button>
          <button type="button" className="c-skip" onClick={() => onSetSkip(uid, setIdx)}>
            {ICO.skip}
          </button>
        </div>
      )}
    </div>
  );
}

function RestControl({
  timerKey,
  restSeconds,
  restOverride,
  timer,
  onRestOpen,
  onRestMode,
  onRestReset,
  onRestStop,
  onRestAdjust,
}: {
  timerKey: string;
  restSeconds: number;
  restOverride?: number;
  timer?: RestTimer;
  onRestOpen: (key: string, seconds: number) => void;
  onRestMode: (key: string, mode: "countdown" | "stopwatch") => void;
  onRestReset: (key: string) => void;
  onRestStop: (key: string) => void;
  onRestAdjust?: (key: string, delta: number, fallbackSeconds: number) => void;
}) {
  const effective = restOverride ?? restSeconds;
  if (!effective && !timer) return null;

  if (!timer) {
    return (
      <div className="rest">
        <div className="rest-start-row">
          <button
            className="rest-start"
            onClick={() => onRestOpen(timerKey, effective)}
          >
            {ICO.rest}Rest {effective}s
          </button>
          {onRestAdjust && (
            <div className="rest-stepper">
              <button type="button" onClick={() => onRestAdjust(timerKey, -15, restSeconds)} aria-label="Reduce rest by 15 seconds">−15</button>
              <button type="button" onClick={() => onRestAdjust(timerKey, 15, restSeconds)} aria-label="Add 15 seconds of rest">+15</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const remaining = timer.mode === "countdown" ? timer.seconds - timer.elapsed : timer.elapsed;
  const over = timer.mode === "countdown" && remaining < 0;
  const pct = timer.mode === "countdown"
    ? Math.max(0, Math.min(100, (1 - timer.elapsed / Math.max(1, timer.seconds)) * 100))
    : Math.min(100, (timer.elapsed / Math.max(1, timer.seconds)) * 100);

  return (
    <div className="rest">
      <div className="rest-panel">
        <div className="rest-modes" role="tablist" aria-label="Rest timer mode">
          <button
            className={`rest-mode${timer.mode === "countdown" ? " on" : ""}`}
            onClick={() => onRestMode(timerKey, "countdown")}
            role="tab"
            aria-selected={timer.mode === "countdown"}
          >
            Countdown
          </button>
          <button
            className={`rest-mode${timer.mode === "stopwatch" ? " on" : ""}`}
            onClick={() => onRestMode(timerKey, "stopwatch")}
            role="tab"
            aria-selected={timer.mode === "stopwatch"}
          >
            Stopwatch
          </button>
        </div>
        <div className="rest-clock">
          <div className={`rest-num${over ? " over" : ""}`} role="timer" aria-live="off">
            {mmss(remaining)}
          </div>
          <div className="rest-sub">
            {timer.mode === "countdown"
              ? (over ? `Over the prescribed ${timer.seconds}s rest` : `Counting down from ${timer.seconds}s — prescribed rest`)
              : "Counting up — no target"}
          </div>
        </div>
        <div className="rest-bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="rest-acts">
          {onRestAdjust && timer.mode === "countdown" && (
            <>
              <button type="button" onClick={() => onRestAdjust(timerKey, 15, restSeconds)} aria-label="Add 15 seconds of rest">+15s</button>
              <button type="button" onClick={() => onRestAdjust(timerKey, -15, restSeconds)} aria-label="Reduce rest by 15 seconds">−15s</button>
            </>
          )}
          <button onClick={() => onRestReset(timerKey)}>Reset</button>
          <button className="stop" onClick={() => onRestStop(timerKey)}>Stop rest</button>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({
  sessionId,
  exercise,
  state,
  restTimerKey,
  restTimer,
  restSeconds,
  restOverride,
  inPick,
  isPicked,
  onSetDone,
  onSetSkip,
  onSetField,
  onNoteToggle,
  onNoteInput,
  onSwapUnit,
  onAddSet,
  onPickToggle,
  onRestOpen,
  onRestMode,
  onRestReset,
  onRestStop,
  onRestAdjust,
  isComplete,
  sessionCompleted,
}: {
  sessionId: string;
  exercise: Exercise;
  state: ExState | undefined;
  restTimerKey: string;
  restTimer?: RestTimer;
  restSeconds: number;
  restOverride?: number;
  inPick: boolean;
  isPicked: boolean;
  onSetDone: (uid: string, setIdx: number) => void;
  onSetSkip: (uid: string, setIdx: number) => void;
  onSetField: (uid: string, setIdx: number, field: "reps" | "weight" | "duration", value: string) => void;
  onNoteToggle: (uid: string) => void;
  onNoteInput: (uid: string, value: string) => void;
  onSwapUnit: (uid: string) => void;
  onAddSet: (uid: string) => void;
  onPickToggle: (uid: string) => void;
  onRestOpen: (key: string, seconds: number) => void;
  onRestMode: (key: string, mode: "countdown" | "stopwatch") => void;
  onRestReset: (key: string) => void;
  onRestStop: (key: string) => void;
  onRestAdjust: (key: string, delta: number, fallbackSeconds: number) => void;
  isComplete: boolean;
  /** Phase 2 — session is completed, sets are read-only */
  sessionCompleted?: boolean;
}) {
  const uid = exercise.uid ?? "";
  const timeBased = isTimeBased(exercise.reps, exercise.log_type);
  const sets = state?.sets ?? [];
  const displayUnit = state?.displayUnit ?? "kg";
  const note = state?.note ?? "";
  const noteOpen = state?.noteOpen ?? false;
  const presc = formatPrescription(exercise);

  const hasVideo = !!(exercise.media?.video_url);

  const exCls = [
    "ex",
    isComplete ? "complete" : "",
    isPicked ? "picked" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={exCls}>
      <div className="ex-hd">
        <div className="nm">
          {isComplete && <span className="ex-complete-ic">{ICO.check}</span>}
          {exercise.exercise_name}
        </div>
        <div className="c-meta">
          {exercise.equipment && exercise.equipment.length > 0 && (
            <span className="c-eq">{exercise.equipment.join(", ")}</span>
          )}
          <span className="c-tgt">{exercise.sets ?? 1} sets × {exercise.reps || "—"}</span>
          {!isBandEquipment(exercise.equipment ?? []) && (
            <button className="c-sw" onClick={() => onSwapUnit(uid)}>
              {displayUnit} ⇄
            </button>
          )}
        </div>
      </div>

      <div className="c-cols">
        <span>Set</span>
        <span>{timeBased ? "Duration" : "Reps"}</span>
        <span>{timeBased ? "" : `Weight (${displayUnit})`}</span>
        <span>Log</span>
      </div>

      {sets.map((set, sIdx) => (
        <CondensedSetRow
          key={sIdx}
          exercise={exercise}
          set={set}
          setIdx={sIdx}
          displayUnit={displayUnit}
          onSetDone={onSetDone}
          onSetSkip={onSetSkip}
          onSetField={onSetField}
          readOnly={sessionCompleted}
        />
      ))}

      {noteOpen && (
        <div className="ex-note-row">
          <textarea
            value={note}
            onChange={(e) => onNoteInput(uid, e.target.value)}
            placeholder="Quick note about this exercise…"
          />
        </div>
      )}

      {!sessionCompleted && (
        <button className="add-set" onClick={() => onAddSet(uid)}>
          {ICO.plus}Add set
        </button>
      )}

      <RestControl
        timerKey={restTimerKey}
        restSeconds={restSeconds}
        restOverride={restOverride}
        timer={restTimer}
        onRestOpen={onRestOpen}
        onRestMode={onRestMode}
        onRestReset={onRestReset}
        onRestStop={onRestStop}
        onRestAdjust={onRestAdjust}
      />
    </div>
  );
}

function SupersetBlock({
  block,
  exStates,
  inPick,
  picked,
  restTimers,
  restOverrides,
  onSetDone,
  onSetSkip,
  onSetField,
  onNoteToggle,
  onNoteInput,
  onSwapUnit,
  onAddSet,
  onPickToggle,
  onRestOpen,
  onRestMode,
  onRestReset,
  onRestStop,
  onRestAdjust,
  onUngroup,
  exComplete,
  sessionCompleted,
}: {
  block: { type: "group"; label?: string; items: Exercise[] };
  exStates: Record<string, ExState>;
  inPick: boolean;
  picked: Record<string, boolean>;
  restTimers: Record<string, RestTimer>;
  restOverrides: Record<string, number>;
  onSetDone: (uid: string, setIdx: number) => void;
  onSetSkip: (uid: string, setIdx: number) => void;
  onSetField: (uid: string, setIdx: number, field: "reps" | "weight" | "duration", value: string) => void;
  onNoteToggle: (uid: string) => void;
  onNoteInput: (uid: string, value: string) => void;
  onSwapUnit: (uid: string) => void;
  onAddSet: (uid: string) => void;
  onPickToggle: (uid: string) => void;
  onRestOpen: (key: string, seconds: number) => void;
  onRestMode: (key: string, mode: "countdown" | "stopwatch") => void;
  onRestReset: (key: string) => void;
  onRestStop: (key: string) => void;
  onRestAdjust: (key: string, delta: number, fallbackSeconds: number) => void;
  onUngroup: (label: string) => void;
  exComplete: (uid: string) => boolean;
  /** Phase 2 — session is completed, sets are read-only */
  sessionCompleted?: boolean;
}) {
  const label = block.label ?? "?";
  const totalRounds = Math.max(...block.items.map((ex) => ex.sets || 1));
  const [expandedExs, setExpandedExs] = useState<Record<string, boolean>>({});
  const toggleAccordion = (uid: string) => {
    setExpandedExs((prev) => ({ ...prev, [uid]: !prev[uid] }));
  };

  return (
    <div className="grp-wrap">
      <div className="grp-h">
        <span className="grp-pill">Superset {label}</span>
        <span className="grp-note">round by round · shared rest</span>
        <button className="c-sw" onClick={() => onUngroup(label)}>Ungroup</button>
      </div>
      <div className="grp-legends">
        {block.items.map((ex) => {
          const uid = ex.uid ?? "";
          const st = exStates[uid];
          const complete = ex.uid ? exComplete(ex.uid) : false;
          const isPicked = !!picked[uid];
          const timeBased = isTimeBased(ex.reps, ex.log_type);
          const presc = formatPrescription(ex);
          const hasVideo = !!(ex.media?.video_url);
          const isExpanded = !!expandedExs[uid];

          return (
            <div key={uid} className={`rx-row${isExpanded ? " expanded" : ""}`}>
              <div className="rx-header" onClick={() => toggleAccordion(uid)}>
                {inPick && (
                  <button
                    className="pick-box"
                    onClick={(e) => { e.stopPropagation(); onPickToggle(uid); }}
                    aria-pressed={isPicked}
                    aria-label={`Select ${ex.exercise_name}`}
                  >
                    {ICO.checkSm}
                  </button>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="rx-name">
                    {complete && <span className="ex-complete-ic">{ICO.check}</span>}
                    {ex.exercise_name}
                  </div>
                  <div className="rx-sub">{presc}{ex.equipment && ex.equipment.length > 0 ? ` · ${ex.equipment[0]}` : ""}</div>
                </div>
                <span className="rx-chevron">{isExpanded ? "⌃" : "⌄"}</span>
              </div>
              {isExpanded && (
                <div className="rx-detail">
                  <span className="rx-chip">{timeBased ? "Time" : "Reps & weight"}</span>
                  {ex.load && (() => {
                    const p = parseLoad(ex.load);
                    if (!p) return null;
                    if (p.kind === "weight") return <span className="rx-load">Load: {p.value}{p.unit}</span>;
                    if (p.kind === "pair") return <span className="rx-load">Load: {p.multiplier} × {p.value}{p.unit}</span>;
                    if (p.kind === "token") return <span className="rx-load">Load: {p.label}{p.sub ? ` ${p.sub}` : ""}</span>;
                    if (p.kind === "band") return <span className="rx-load">Load: {p.colour} band</span>;
                    return null;
                  })()}
                  {!isBandEquipment(ex.equipment ?? []) && !timeBased && (
                    <button className="c-sw" onClick={(e) => { e.stopPropagation(); onSwapUnit(uid); }}>
                      {(st?.displayUnit ?? "kg") === "kg" ? "lb" : "kg"} ⇄
                    </button>
                  )}
                  <div className="rx-actions">
                    {hasVideo ? (
                      <a className="c-skip" href={ex.media?.video_url} target="_blank" rel="noopener noreferrer" aria-label={`Play demo video for ${ex.exercise_name}`}>🎥</a>
                    ) : (
                      <button className="c-skip" disabled aria-label={`No demo video for ${ex.exercise_name}`}>🎥</button>
                    )}
                    <button className="c-skip" onClick={() => onNoteToggle(uid)} aria-label={`Note on ${ex.exercise_name}`}>💬</button>
                    {!sessionCompleted && (
                      <button className="c-skip" onClick={() => onAddSet(uid)}>+ set</button>
                    )}
                  </div>
                </div>
              )}
              {(st?.noteOpen) && st?.note !== undefined && (
                <div className="ex-note-row" style={{ borderTop: "1px solid var(--border)", padding: "10px 12px" }}>
                  <textarea
                    value={st.note}
                    onChange={(e) => onNoteInput(uid, e.target.value)}
                    placeholder="Quick note about this exercise…"
                    style={{ flex: 1, minHeight: 56, resize: "vertical", border: "1px solid var(--field-border)", borderRadius: 9, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grp-rounds">
        {Array.from({ length: totalRounds }, (_, roundIdx) => {
          let anyPresent = false;
          let maxRest = 0;
          const roundRows: React.ReactNode[] = [];
          block.items.forEach((ex) => {
            const uid = ex.uid ?? "";
            const st = exStates[uid];
            const set = st?.sets[roundIdx];
            if (!set) return;
            anyPresent = true;
            if (parseRestSeconds(ex.rest ?? "") && (parseRestSeconds(ex.rest ?? "") ?? 0) > maxRest) {
              maxRest = parseRestSeconds(ex.rest ?? "") ?? 0;
            }
            roundRows.push(
              <div key={`${uid}-${roundIdx}`} className="round-ex">
                <div className="round-ex-name" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
                  {ex.exercise_name}
                  {ex.load && (() => {
                    const p = parseLoad(ex.load);
                    if (!p) return null;
                    if (p.kind === "weight") return <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2, borderRadius: "var(--r-nested, 12px)", border: "1px solid rgba(193,131,159,.2)", background: "rgba(193,131,159,.05)", padding: "1px 4px", fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--rose)" }}>{p.value}<span style={{ fontSize: 9, color: "rgba(193,131,159,.8)" }}>{p.unit}</span></span>;
                    if (p.kind === "pair") return <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2, borderRadius: "var(--r-nested, 12px)", border: "1px solid rgba(193,131,159,.2)", background: "rgba(193,131,159,.05)", padding: "1px 4px", fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--rose)" }}>{p.multiplier}×{p.value}<span style={{ fontSize: 9, color: "rgba(193,131,159,.8)" }}>{p.unit}</span></span>;
                    if (p.kind === "token") return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--r-nested, 12px)", border: "1px solid rgba(193,131,159,.2)", background: "rgba(193,131,159,.05)", padding: "1px 4px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--rose)" }}>{p.label}</span>;
                    if (p.kind === "band") return <span style={{ display: "inline-flex", alignItems: "center", gap: 2, borderRadius: "var(--r-nested, 12px)", border: "1px solid rgba(193,131,159,.2)", background: "rgba(193,131,159,.05)", padding: "1px 4px", fontSize: 10, fontWeight: 700, color: "var(--rose)" }}>{p.colour}</span>;
                    return null;
                  })()}
                </div>
                <div className="c-cols" style={{ paddingTop: 0 }}>
                  <span></span>
                  <span>{isTimeBased(ex.reps, ex.log_type) ? "Duration" : "Reps"}</span>
                  <span>{isTimeBased(ex.reps, ex.log_type) ? "" : `Weight (${st?.displayUnit ?? "kg"})`}</span>
                  <span>Log</span>
                </div>
                <CondensedSetRow
                  exercise={ex}
                  set={set}
                  setIdx={roundIdx}
                  displayUnit={st?.displayUnit ?? "kg"}
                  onSetDone={onSetDone}
                  onSetSkip={onSetSkip}
                  onSetField={onSetField}
                  readOnly={sessionCompleted}
                />
              </div>
            );
          });
          if (!anyPresent) return null;
          const roundKey = `grp:${label}:${roundIdx}`;
          return (
            <div key={roundIdx} className="grp-round">
              <div className="round-label">Round {roundIdx + 1} of {totalRounds}</div>
              {roundRows}
              <RestControl
                timerKey={roundKey}
                restSeconds={maxRest || 60}
                restOverride={restOverrides[roundKey]}
                timer={restTimers[roundKey]}
                onRestOpen={onRestOpen}
                onRestMode={onRestMode}
                onRestReset={onRestReset}
                onRestStop={onRestStop}
                onRestAdjust={onRestAdjust}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
