/**
 * Delivery-time queue resolution — CR-EF-154 P3.
 *
 * Resolves what a session SHOULD contain based on the program queue at serve
 * time. Sessions carry a static stamped copy of their workout; this module
 * re-stamps them lazily when the content is served, so cancellations and
 * completions shift the queue without manual intervention.
 *
 * Server-only: imports pg shim. Client-safe queue logic lives in ./resolve.ts.
 */

import { supabase } from "@/lib/supabase";
import { ensureUids } from "@/lib/exercise-ref";
import { backfillExerciseMedia } from "@/lib/exercise-media";
import { resolveQueue, resolveSlotForWeek } from "./resolve";
import type {
  DBProgram,
  DBProgramSlot,
  SlotData,
  ProgramExercise,
  ProgramSection,
  QueueState,
} from "./types";
import type { DBSession, Session, SessionVersion, Exercise, DeliveryMode } from "@/types";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

type PgClient = { from: (table: string) => ReturnType<typeof import("@/lib/pg-client").createPgClient>["from"] };

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/** Derive group_label from a ProgramSection for multi-exercise supersets/circuits. */
function sectionGroupLabel(section: ProgramSection): string | undefined {
  if (
    (section.kind === "superset" || section.kind === "circuit") &&
    section.exercises.length > 1
  ) {
    const label = section.label?.trim();
    return label || (section.kind === "superset" ? "Superset" : "Circuit");
  }
  return undefined;
}

/**
 * Convert ProgramExercise → Exercise, filling required fields with empty
 * defaults. Preserves exercise_name, sets, reps, load, group_label.
 */
function programExerciseToExercise(
  pe: ProgramExercise,
  groupLabel?: string,
): Exercise {
  return {
    exercise_name: pe.exercise_name,
    sets: pe.sets ?? 1,
    reps: pe.reps ?? "10",
    tempo: "",
    rest: "",
    coaching_cue: "",
    modification: "",
    load: pe.weight,
    equipment: [],
    group_label: groupLabel,
  };
}

/**
 * Transform a SlotData (sections-based) into a SessionVersion
 * (warm_up/main_block/cooldown). Maps section kinds to version keys.
 * Preserves group_label on superset/circuit exercises.
 */
function slotToSessionVersion(
  slotData: SlotData,
  exerciseMetaByName?: Map<string, Exercise>,
): SessionVersion {
  const warmUp: Exercise[] = [];
  const mainBlock: Exercise[] = [];
  const cooldown: Exercise[] = [];

  for (const section of slotData.sections) {
    const groupLabel = sectionGroupLabel(section);

    for (const pe of section.exercises) {
      let ex = programExerciseToExercise(pe, groupLabel);

      // Carry media/equipment/group_label from previous stamped session of
      // the same archetype, matching by exercise name.
      if (exerciseMetaByName) {
        const meta = exerciseMetaByName.get(pe.exercise_name.toLowerCase());
        if (meta) {
          if (meta.media) ex.media = meta.media;
          if (meta.equipment?.length) ex.equipment = meta.equipment;
          if (meta.group_label) ex.group_label = meta.group_label;
        }
      }

      switch (section.kind) {
        case "warmup":
          warmUp.push(ex);
          break;
        case "cooldown":
          cooldown.push(ex);
          break;
        default:
          // straight, superset, circuit → main_block
          mainBlock.push(ex);
          break;
      }
    }
  }

  return { warm_up: warmUp, main_block: mainBlock, cooldown: cooldown };
}

// ─────────────────────────────────────────────────────────────────────
// Single-session re-stamp
// ─────────────────────────────────────────────────────────────────────

/**
 * Check whether a session is eligible for re-stamping at serve time.
 * A session must have an active programme, not be completed, cancelled,
 * in-progress, supplementary, or already carrying set_logs.
 */
function isEligible(session: DBSession, hasActiveProgram: boolean): boolean {
  if (!hasActiveProgram) return false;
  if (!session.program_id) return false;
  if (session.completed_at) return false;
  if (session.cancelled_at) return false;
  if (session.status === "completed" || session.status === "cancelled" || session.status === "in_progress") return false;
  if (session.parent_session_id) return false; // supplementary
  return true;
}

/**
 * Given a session and its block's sessions, resolve the program queue and
 * re-stamp if the session's position/week/archetype disagrees.
 *
 * Returns the session row — modified if re-stamped, original if no change.
 * Never touches completed sessions, cancelled sessions, sessions with
 * set_logs, or sessions in_progress.
 *
 * IMPORTANT: modifies the DB row when re-stamping. The returned session
 * object is the updated row from the database.
 */
export async function reStampSession(
  session: DBSession,
  blockSessions: DBSession[],
): Promise<DBSession> {
  // 1. Check client has active program
  const blockRes = await supabase
    .from("blocks")
    .select("client_id")
    .eq("id", session.block_id)
    .single();

  const clientId = (blockRes.data as { client_id: string } | null)?.client_id;
  if (!clientId) return session;

  const clientRes = await supabase
    .from("clients")
    .select("active_program_id, delivery_mode")
    .eq("id", clientId)
    .single();

  const client = clientRes.data as { active_program_id: string | null; delivery_mode: string } | null;
  if (!client?.active_program_id) return session;

  if (!isEligible(session, true)) return session;

  // 2. Check no set_logs exist (defensive — status should already guard this)
  const { count: setLogCount } = await supabase
    .from("set_logs")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session.id);

  if ((setLogCount ?? 0) > 0) return session;

  // 3. Load program and slots
  const programId = client.active_program_id;

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programId)
    .single();

  if (!program) return session;

  const { data: slots } = await supabase
    .from("program_slots")
    .select("*")
    .eq("program_id", programId)
    .order("position", { ascending: true });

  if (!slots || slots.length === 0) return session;

  const slotCount = slots.length;

  // 4. Count completed sessions
  const { count: completedCount } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId)
    .eq("status", "completed")
    .is("parent_session_id", null);

  const completed = completedCount ?? 0;

  // 5. Rank this session among upcoming booked sessions
  const upcomingSessions = blockSessions
    .filter(
      (s) =>
        s.program_id === programId &&
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

  const sessionRank = upcomingSessions.findIndex((s) => s.id === session.id);
  if (sessionRank === -1) return session;

  const expectedPosition = completed + sessionRank + 1;
  const expectedWeek = Math.min(
    Math.floor((expectedPosition - 1) / slotCount) + 1,
    (program as DBProgram).weeks,
  );

  // 6. Check if stamp is stale
  const currentPosition = session.program_slot_id
    ? (slots as DBProgramSlot[]).find((sl) => sl.id === session.program_slot_id)
        ?.position
    : null;
  const currentWeek = session.week;

  if (
    currentPosition === expectedPosition &&
    currentWeek === expectedWeek &&
    session.archetype !== null
  ) {
    return session; // stamp is current
  }

  // 7. Resolve the slot for the expected position
  const rotationIndex = ((expectedPosition - 1) % slotCount) + 1;
  const slot = (slots as DBProgramSlot[]).find(
    (sl) => sl.position === rotationIndex,
  );
  if (!slot) return session;

  const resolved = resolveSlotForWeek(slot.data, expectedWeek);

  // 8. Fetch exercise history from most recent stamped session of same archetype
  const exerciseMetaByName = await fetchExerciseMeta(clientId, session.archetype);

  // 9. Build session data from slot
  const versions: Session["versions"] = {
    studio: slotToSessionVersion(resolved, exerciseMetaByName),
    home: slotToSessionVersion(resolved, exerciseMetaByName),
  };

  // Media backfill is NOT done here — the caller (session view page) handles
  // it with the correct delivery mode. This keeps reStampSession pure DB.

  const newData: Session = {
    ...(session.data as Session),
    versions,
    focus_label: slot.label?.trim() || `Workout ${slot.position}`,
    week: expectedWeek,
  };

  // Preserve session_log and exercise_notes already on the row
  if ((session.data as Session)?.session_log) {
    newData.session_log = (session.data as Session).session_log;
  }
  if ((session.data as Session)?.exercise_notes) {
    newData.exercise_notes = (session.data as Session).exercise_notes;
  }

  // 10. Write the update
  const { data: updated } = await supabase
    .from("sessions")
    .update({
      data: newData,
      archetype: session.archetype, // preserve existing archetype
      week: expectedWeek,
      program_id: programId,
      program_slot_id: slot.id,
    })
    .eq("id", session.id)
    .select()
    .single();

  return (updated as DBSession) ?? session;
}

// ─────────────────────────────────────────────────────────────────────
// Batch re-stamp (for the blocks API route)
// ─────────────────────────────────────────────────────────────────────

/**
 * Re-stamp all eligible sessions in a block. Optimised to fetch shared data
 * (program state, completed count) once, then batch-update only stale sessions.
 *
 * Returns the updated sessions array. Unmodified sessions keep their original
 * references; re-stamped sessions are replaced with the updated DB row.
 */
export async function reStampBlockSessions(
  sessions: DBSession[],
  clientId: string,
): Promise<DBSession[]> {
  // 1. Check client has active program
  const { data: client } = await supabase
    .from("clients")
    .select("active_program_id, delivery_mode")
    .eq("id", clientId)
    .single();

  const activeProgramId = (client as { active_program_id: string | null } | null)
    ?.active_program_id;
  if (!activeProgramId) return sessions;

  const deliveryMode: DeliveryMode =
    (client as { delivery_mode?: string } | null)?.delivery_mode === "home_training"
      ? "home_training"
      : "studio_1to1";

  // 2. Filter eligible sessions
  const eligible = sessions.filter((s) => isEligible(s, true));
  if (eligible.length === 0) return sessions;

  // 3. Check set_logs for each eligible session (batch query)
  const eligibleIds = eligible.map((s) => s.id);
  const { data: setLogRows } = await supabase
    .from("set_logs")
    .select("session_id")
    .in("session_id", eligibleIds);

  const sessionsWithLogs = new Set(
    (setLogRows ?? []).map((r: { session_id: string }) => r.session_id),
  );

  const needStamp = eligible.filter((s) => !sessionsWithLogs.has(s.id));
  if (needStamp.length === 0) return sessions;

  // 4. Load program and slots (once)
  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", activeProgramId)
    .single();

  if (!program) return sessions;

  const { data: slots } = await supabase
    .from("program_slots")
    .select("*")
    .eq("program_id", activeProgramId)
    .order("position", { ascending: true });

  if (!slots || slots.length === 0) return sessions;

  const slotCount = slots.length;
  const programWeeks = (program as DBProgram).weeks;

  // 5. Count completed sessions (once)
  const { count: completedCount } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("program_id", activeProgramId)
    .eq("status", "completed")
    .is("parent_session_id", null);

  const completed = completedCount ?? 0;

  // 6. Rank all upcoming sessions
  const upcomingSessions = sessions
    .filter(
      (s) =>
        s.program_id === activeProgramId &&
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

  // 7. Build exercise meta from the most recent completed session of each archetype
  const exerciseMetaCache = new Map<string, Map<string, Exercise>>();

  // 8. Stamp each session
  const updatedMap = new Map<string, DBSession>();

  for (const session of needStamp) {
    const rank = upcomingSessions.findIndex((s) => s.id === session.id);
    if (rank === -1) continue;

    const expectedPosition = completed + rank + 1;
    const expectedWeek = Math.min(
      Math.floor((expectedPosition - 1) / slotCount) + 1,
      programWeeks,
    );

    const currentPosition = session.program_slot_id
      ? (slots as DBProgramSlot[]).find((sl) => sl.id === session.program_slot_id)
          ?.position
      : null;

    if (
      currentPosition === expectedPosition &&
      session.week === expectedWeek &&
      session.archetype !== null
    ) {
      continue; // stamp is current
    }

    const rotationIndex = ((expectedPosition - 1) % slotCount) + 1;
    const slot = (slots as DBProgramSlot[]).find(
      (sl) => sl.position === rotationIndex,
    );
    if (!slot) continue;

    const resolved = resolveSlotForWeek(slot.data, expectedWeek);

    // Lazy-load exercise meta per archetype
    const archKey = session.archetype ?? "";
    if (!exerciseMetaCache.has(archKey)) {
      exerciseMetaCache.set(
        archKey,
        await fetchExerciseMeta(clientId, session.archetype),
      );
    }
    const exerciseMeta = exerciseMetaCache.get(archKey)!;

    const versionKey: "studio" | "home" =
      deliveryMode === "home_training" ? "home" : "studio";

    const versions: Session["versions"] = {
      studio: slotToSessionVersion(resolved, exerciseMeta),
      home: slotToSessionVersion(resolved, exerciseMeta),
    };

    const versionData: SessionVersion = versions[versionKey];
    const backfilled = await backfillExerciseMedia(
      supabase as unknown as Parameters<typeof backfillExerciseMedia>[0],
      [...versionData.warm_up, ...versionData.main_block, ...versionData.cooldown],
    );
    const warmLen = versionData.warm_up.length;
    const mainLen = versionData.main_block.length;
    versions[versionKey] = {
      warm_up: ensureUids(backfilled.slice(0, warmLen)),
      main_block: ensureUids(backfilled.slice(warmLen, warmLen + mainLen)),
      cooldown: ensureUids(backfilled.slice(warmLen + mainLen)),
    };

    const newData: Session = {
      ...(session.data as Session),
      versions,
      focus_label: slot.label?.trim() || `Workout ${slot.position}`,
      week: expectedWeek,
    };

    if ((session.data as Session)?.session_log) {
      newData.session_log = (session.data as Session).session_log;
    }
    if ((session.data as Session)?.exercise_notes) {
      newData.exercise_notes = (session.data as Session).exercise_notes;
    }

    const { data: updated } = await supabase
      .from("sessions")
      .update({
        data: newData,
        archetype: session.archetype,
        week: expectedWeek,
        program_id: activeProgramId,
        program_slot_id: slot.id,
      })
      .eq("id", session.id)
      .select()
      .single();

    if (updated) {
      updatedMap.set(session.id, updated as DBSession);
    }
  }

  // 9. Merge updates into original array
  if (updatedMap.size === 0) return sessions;
  return sessions.map((s) => updatedMap.get(s.id) ?? s);
}

// ─────────────────────────────────────────────────────────────────────
// Exercise metadata fetch
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a name→Exercise lookup from the most recent completed session of the
 * given archetype for this client. Used to carry media, equipment, and
 * group_label from previous stamps into new ones.
 *
 * Returns an empty Map if no completed session of this archetype exists.
 */
async function fetchExerciseMeta(
  clientId: string,
  archetype: string | null,
): Promise<Map<string, Exercise>> {
  const meta = new Map<string, Exercise>();
  if (!archetype) return meta;

  // Find the most recent completed session with this archetype for this client
  // (via block join on client_id)
  const { data: prevSessions } = await supabase
    .from("sessions")
    .select("id, data, block_id, blocks!inner(client_id)")
    .eq("blocks.client_id", clientId)
    .eq("archetype", archetype)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1);

  if (!prevSessions || prevSessions.length === 0) return meta;

  const prevData = (prevSessions[0] as { data?: Session })?.data;
  if (!prevData?.versions) return meta;

  // Use the studio version as the canonical source for metadata
  const studio = prevData.versions.studio;
  if (!studio) return meta;

  for (const ex of [
    ...studio.warm_up,
    ...studio.main_block,
    ...studio.cooldown,
  ]) {
    const name = ex.exercise_name?.toLowerCase();
    if (!name) continue;
    if (!meta.has(name)) {
      meta.set(name, ex);
    }
  }

  return meta;
}
