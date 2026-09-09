# Lane: BUG-EF-151 + BUG-EF-152 + BUG-EF-153 — review surfaces must use the shared derivations

## REDISPATCH — YOUR FIRST ACTION IS AN EDIT + COMMIT
The previous run read files for its whole budget and committed NOTHING. This time: start with Phase 1's FIRST concrete edit (review/page.tsx:82 derived-block chain), commit it, THEN continue. Make the edit and commit FIRST; investigate only what the next edit needs. Commit after every file you finish. Path note: the block-review screen lives at `app/hub/(protected)/clients/[id]/updates/block-review/[blockId]/` (under updates/ — the previous run looked in the wrong place).

Work ONLY here. COMMIT after each numbered phase to lane/ef-review-truth. No pushes, no dev servers/browsers. `npx tsc --noEmit` clean per phase.

Root cause (confirmed): the review surfaces re-derive facts from partial data instead of the shared helpers — `deriveBlockStatus` (lib/block-status.ts), `deriveSessionStatus` (lib/session-status.ts), and the combined hub+Trainerize trends (`buildExerciseTrends(combinedSetLogs)` as built in `clients/[id]/page.tsx:139-145`).

## Phase 1 — BUG-EF-151 (Full review empty context). COMMIT.
`app/hub/(protected)/clients/[id]/review/page.tsx`:
- `:82` replace `blocks?.find(b => b.status === "active")` with the client record's derived chain (`page.tsx:372-378` pattern: derived-active → approved → blocks[0]); fall back to all-blocks scope if nothing resolves.
- `:94-111` pbsCount must come from the same combined hub+Trainerize source the Progress drawer uses (fetch trainerize_workout_results + `trainerizeResultsToSetLogs`, same as `clients/[id]/page.tsx:120-145`), scoped to the review period where a period exists, otherwise all-time.
- `ReviewFlowClient.tsx:475-506`: only render the EmptyState when the client has NO completed sessions anywhere; otherwise show Delivered/PBs/Position from whatever scope resolved. "No previous review on file" may stay as a one-line note — it must not suppress current-period stats.

## Phase 2 — BUG-EF-152 ("0 of 28 booked"). COMMIT.
- `lib/block-review-facts.ts:35-59` `computeAttendanceFacts`: derive completed/cancelled via `deriveSessionStatus({ ...s, session_log: s.data?.session_log })` (the `??` fallback is dead — status is NOT NULL DEFAULT 'planned'). Booked excludes derived-cancelled (not just cancelled_at).
- Split the denominator by time: "X of Y booked" counts only sessions with scheduled_at in the past; future bookings reported separately ("N still to come"). The "never logged as completed" warning line must not fire for future-dated sessions.
- `ClientDrawers.tsx` (~:1707, :1790): route the review button to the most recent block that HAS past-dated sessions, not blindly sortedBlocks[0]; if only a future block exists, the review screen states "this block hasn't started yet".

## Phase 3 — BUG-EF-153 (below-best card). COMMIT.
- `BlockReviewClient.tsx:194-212`: title/tone state-dependent — teal "Back at {possessive} best on everything" when no regressions, amber "Still below {possessive} best on N lifts" when there are (use lib/pronouns.ts, gender is available/threadable).
- Distinguish the three empty causes in copy: no regressions / not enough repeat logs to compare / no set logs in range.
- Feed `computeBelowBestFacts` the combined hub+Trainerize set-log source (same as Phase 1) via `block-review/[blockId]/page.tsx:74-84` so it can't disagree with the Progress drawer.

Done: tsc clean, 3 commits, commit messages name the shared helpers now used.
