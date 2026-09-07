/**
 * Shared programme-consumption counter — BUG-EF-137 R2.
 *
 * Single source of truth for "how many paid slots has this client consumed?"
 * Used by queue.ts (UI display) and delivery.ts (re-stamp ranking).
 *
 * Server-only: imports pg shim.
 */

import { supabase } from "@/lib/supabase";
import { isRepeat } from "./resolve";

/**
 * Count completed, non-supplementary, non-repeat sessions across the given
 * blocks. These are the sessions that "consume" a paid slot in the programme
 * queue — they advance the pointer.
 *
 * Accepts either:
 *  - `clientId` — fetches active block IDs for that client, or
 *  - `blockIds` — counts across exactly those blocks.
 *
 * Predicates (aligned with delivery.ts):
 *  - `completed_at IS NOT NULL` (or status = completed)
 *  - `parent_session_id IS NULL` (excludes supplementary sub-sessions)
 *  - `isRepeat(data->>'program_repeat')` excluded (repeat sessions consume a
 *    slot but do NOT advance the queue)
 *
 * NO program_id filter — scheduled sessions don't carry program_id in
 * production, and completed ones may not either if they were completed before
 * the delivery resolver existed.
 */
export async function countProgramConsumed(opts: {
  clientId?: string;
  blockIds?: string[];
}): Promise<number> {
  let blockIds = opts.blockIds;

  if (!blockIds) {
    if (!opts.clientId) return 0;
    const { data: blocks } = await supabase
      .from("blocks")
      .select("id")
      .eq("client_id", opts.clientId)
      .eq("status", "active");
    blockIds = (blocks ?? []).map((b: { id: string }) => b.id);
    if (blockIds.length === 0) return 0;
  }

  const { data: completedRows } = await supabase
    .from("sessions")
    .select("id, data")
    .in("block_id", blockIds)
    .not("completed_at", "is", null)
    .is("parent_session_id", null);

  return (completedRows ?? []).filter(
    (r: { data?: Record<string, unknown> }) => !isRepeat(r.data?.program_repeat),
  ).length;
}
