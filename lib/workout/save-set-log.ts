import type { SetLog } from "@/types";
import { stableSetOpId } from "@/lib/set-log-id";
import { toKg } from "@/lib/units";
import { enqueue, getAllPending, remove, type PendingSetLogEntry } from "@/lib/hub/offline-set-log-queue";

/** Three-way outcome of a set-log save: saved to server, parked for later, or a
 *  genuine server-side failure (which must NOT be queued). */
export type SaveSetLogResult =
  | { kind: "saved"; log: SetLog & { is_new_pb?: boolean } }
  | { kind: "queued"; clientOpId: string }
  | { kind: "failed"; message?: string | null };

interface SetLogFieldValues {
  reps: string;
  weight: string;
  duration: string;
  bandColour?: string;
}

/**
 * Save a single set-log entry to the server, with offline queue fallback.
 *
 * Shared by the hub TrainScreen and the portal WorkoutLog. Ported verbatim
 * from TrainScreen.saveSetLog (CR-EF-129 deterministic op-id, offline
 * enqueue, server failure = never queued).
 *
 * @param setLogsMap - mutable map of "exerciseRef::setNumber" → SetLog; mutated in-place on success
 * @param reuseClientOpId - optional pre-computed idempotency key (e.g. from offline queue replay)
 */
export async function saveSetLog(
  sessionId: string,
  exerciseRef: string,
  setNumber: number,
  fieldValues: SetLogFieldValues,
  completed: boolean,
  isWarmup: boolean,
  displayUnit: "kg" | "lb",
  setLogsMap: Record<string, SetLog>,
  reuseClientOpId?: string,
): Promise<SaveSetLogResult> {
  const key = `${exerciseRef}::${setNumber}`;
  const existing = setLogsMap[key];
  const repsVal = fieldValues.reps.trim() === "" ? null : Number(fieldValues.reps);
  const weightVal = fieldValues.weight.trim() === "" ? null : toKg(Number(fieldValues.weight), displayUnit);
  const durationVal = fieldValues.duration.trim() === "" ? null : Number(fieldValues.duration);
  const bandColourVal = fieldValues.bandColour?.trim() === "" ? undefined : fieldValues.bandColour;

  const clientOpId = reuseClientOpId ?? await stableSetOpId(sessionId, exerciseRef, setNumber);

  const method = existing ? "PATCH" : "POST";

  // Build body: PATCH includes id, POST includes exercise_ref + client_op_id.
  // Only include band_colour when the caller actually provided it (WorkoutLog
  // has band exercises; TrainScreen does not carry bandColour).
  const baseBody: Record<string, unknown> = existing
    ? { id: existing.id, reps: repsVal, weight_kg: weightVal, duration_seconds: durationVal, completed, is_warmup: isWarmup }
    : { exercise_ref: exerciseRef, set_number: setNumber, reps: repsVal, weight_kg: weightVal, duration_seconds: durationVal, completed, is_warmup: isWarmup, client_op_id: clientOpId };
  const body = bandColourVal !== undefined
    ? { ...baseBody, band_colour: bandColourVal }
    : baseBody;

  const enqueueOffline = async (): Promise<SaveSetLogResult> => {
    try {
      await enqueue({
        client_op_id: clientOpId,
        sessionId,
        exerciseRef,
        setNumber,
        method,
        body,
        capturedAt: new Date().toISOString(),
        queuedAt: new Date().toISOString(),
      });
    } catch {
      return { kind: "failed" };
    }
    return { kind: "queued", clientOpId };
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return enqueueOffline();
  }

  let res: Response;
  try {
    res = await fetch(`/api/sessions/${sessionId}/set-logs`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return enqueueOffline();
  }

  if (!res.ok) {
    const message = await res.json().then((b) => b?.error).catch(() => null);
    return { kind: "failed", message };
  }

  const saved: SetLog & { is_new_pb?: boolean } = await res.json();
  setLogsMap[key] = saved;
  return { kind: "saved", log: saved };
}

export interface DrainResult {
  synced: number;
  newPbs: number;
  authError: boolean;
  remainingPending: number;
}

/**
 * Drain the offline set-log queue, replaying each entry to the server.
 *
 * Returns a result object so the caller can decide how to update UI state
 * (toast, sync notice, etc.). The caller is responsible for reconciling
 * each successfully-synced entry back into its own exercise state via the
 * provided callback.
 */
export async function drainSetLogQueue(
  onSynced: (entry: PendingSetLogEntry, data: SetLog & { is_new_pb?: boolean }) => void,
): Promise<DrainResult> {
  const pending = await getAllPending();
  if (pending.length === 0) return { synced: 0, newPbs: 0, authError: false, remainingPending: 0 };

  let synced = 0;
  let newPbs = 0;
  let authError = false;

  for (const entry of pending) {
    try {
      const res = await fetch(`/api/sessions/${entry.sessionId}/set-logs`, {
        method: entry.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...entry.body,
          client_op_id: entry.client_op_id,
          logged_at: entry.capturedAt,
        }),
      });
      if (res.status === 401) {
        authError = true;
        break;
      }
      if (!res.ok) break;
      const data: SetLog & { is_new_pb?: boolean } = await res.json();
      await remove(entry.client_op_id);
      onSynced(entry, data);
      synced += 1;
      if (data.is_new_pb) newPbs += 1;
    } catch {
      break;
    }
  }

  const remainingPending = authError ? (await getAllPending()).length : 0;

  return { synced, newPbs, authError, remainingPending };
}
