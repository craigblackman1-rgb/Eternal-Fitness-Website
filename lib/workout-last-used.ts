/**
 * Server-only: batch-computes "last used" dates for a set of workout names
 * (by focus_label) for a given client. Combines three sources:
 *
 * 1. Hub sessions: latest completed_at from sessions whose data->>'focus_label'
 *    matches (case-insensitive) across all of the client's blocks.
 * 2. Trainerize history: max performed_date from trainerize_workout_results
 *    where workout_name matches (case-insensitive).
 * 3. Pick-mode import: data->>'tz_last_used' on the block sessions themselves.
 *
 * Returns a Map<normalisedFocusLabel, ISO-date-string>.
 */

import { getPool } from "@/lib/pg-client";

export type LastUsedMap = Map<string, string | null>;

/**
 * Normalise a workout name for matching: trim + lowercase.
 */
function norm(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Given a client UUID and a list of workout names (focus_labels), query
 * completed sessions and Trainerize results, merge with the provided
 * tzLastUsed map, and return the most recent date per workout name.
 */
export async function getLastUsedMap(
  clientId: string,
  workoutNames: string[],
  tzLastUsed?: Map<string, string | null>,
): Promise<LastUsedMap> {
  const result: LastUsedMap = new Map();
  for (const name of workoutNames) {
    result.set(norm(name), null);
  }

  if (workoutNames.length === 0) return result;

  const pool = getPool();

  // Source 1: hub completed sessions across all of the client's blocks.
  // sessions has no client_id column — join through blocks.client_id.
  const { rows: hubRows } = await pool.query(
    `
    SELECT
      LOWER(TRIM(s.data->>'focus_label')) AS workout_name,
      MAX(COALESCE(s.completed_at, s.scheduled_at))::text AS last_used
    FROM sessions s
    JOIN blocks b ON b.id = s.block_id
    WHERE b.client_id = $1
      AND s.status = 'completed'
      AND LOWER(TRIM(s.data->>'focus_label')) = ANY($2)
    GROUP BY workout_name
    `,
    [clientId, workoutNames.map(norm)],
  );
  for (const row of hubRows as { workout_name: string; last_used: string | null }[]) {
    if (row.workout_name && row.last_used) {
      const existing = result.get(row.workout_name);
      if (!existing || row.last_used > existing) {
        result.set(row.workout_name, row.last_used);
      }
    }
  }

  // Source 2: Trainerize workout results (performed_date is a DATE column).
  const { rows: tzRows } = await pool.query(
    `
    SELECT
      LOWER(TRIM(workout_name)) AS workout_name,
      MAX(performed_date)::text AS last_used
    FROM trainerize_workout_results
    WHERE client_id = $1
      AND LOWER(TRIM(workout_name)) = ANY($2)
    GROUP BY workout_name
    `,
    [clientId, workoutNames.map(norm)],
  );
  for (const row of tzRows as { workout_name: string; last_used: string | null }[]) {
    if (row.workout_name && row.last_used) {
      const existing = result.get(row.workout_name);
      if (!existing || row.last_used > existing) {
        result.set(row.workout_name, row.last_used);
      }
    }
  }

  // Source 3: pick-mode import fallback — data->>'tz_last_used' on the
  // block sessions themselves. Caller passes these as a pre-built map.
  if (tzLastUsed) {
    for (const [name, date] of tzLastUsed) {
      const n = norm(name);
      if (date && result.get(n) === null) {
        result.set(n, date);
      }
    }
  }

  return result;
}
