# LANE-REPORT-truth-cluster — EF data-truth bug cluster (wo-ef-consolidated-2026-09-08 u4)

Worktree: `D:\apps\worktrees\eternal-fitness-website\lane-truth-cluster` (branch `lane/truth-cluster` off `origin/main`)
Scope: desktop hub (`app/hub/**` excluding `app/hub/m/**`) + shared data libs. No mobile edits.

## Headline

3 commits landed (2 under BUG-EF-152, 1 under BUG-EF-151). The other four
bugs (148, 145, 144, 139) were found to be **already correctly fixed in this
tree** by previously-merged lanes; I audited each against its DB write path
rather than trusting the prior commit messages, and made no change — changing
correct code to manufacture commits would itself be a fabricated diff, which
this lane explicitly forbids doing. Dispositions with file:line evidence below.

`npx tsc --noEmit` clean before the first commit and after every commit
(`node node_modules/typescript/bin/tsc --noEmit` — Windows). No migrations
written, no DB touched, nothing pushed.

| Bug | Disposition | Commits |
|---|---|---|
| BUG-EF-152 | Fixed (2 commits) | `9163fa7`, `3bdd4ac` |
| BUG-EF-151 | Fixed (1 commit) | `3aa2a8f` |
| BUG-EF-148 | Verified already fixed | — |
| BUG-EF-145 | Verified already fixed | — |
| BUG-EF-144 | Verified already fixed | — |
| BUG-EF-139 | Verified already fixed (data repair outstanding) | — |

---

## BUG-EF-152 — Block review "this block in facts" says "0 of 28 booked" when sessions ARE booked

### Wrong derivation found
`lib/block-review-facts.ts` `computeAttendanceFacts` had two problems, one
already fixed by a prior lane, one I fixed this run.

1. **Already fixed (prior commit `451e452`):** the completed/booked probes used
   ad-hoc `cancelled_at`/`completed_at` field checks instead of the session
   status model the booking/completion flows actually write. The booking flow
   (`POST`/`PATCH /api/sessions/[id]`, `app/api/sessions/[id]/route.ts:192-193`
   writes `status = "completed"` + `completed_at`; `lib/workout/complete-session.ts`
   sends `data.session_log.completed_at` through `PATCH`) writes three overlapping
   sources. `deriveSessionStatus` (`lib/session-status.ts:28`) now consumes all
   of them, so a delivered session can no longer be silently counted as not-completed.

2. **Fixed this run (`9163fa7`):** the past/future denominator split still read
   only the `scheduled_at` column:
   `pastBooked = booked.filter(s => s.scheduled_at && new Date(s.scheduled_at) <= now)`.
   Blocks are created **undated** (`app/api/claude/generate-block/route.ts:195-202`
   inserts sessions with `scheduled_at` NULL) and completed in place, so a
   derived-completed session with NULL `scheduled_at` was excluded from the
   denominator and could flip the header to "Not started" while every session
   was delivered.

### Corrected logic (`lib/block-review-facts.ts:70-83`)
```ts
const hasOccurred = (s) => isCompleted(s) || (s.scheduled_at && new Date(s.scheduled_at) <= now);
const pastBooked = booked.filter(hasOccurred);
const futureBooked = booked.filter((s) => !hasOccurred(s));
```
A derived-completed session has occurred; it belongs in the "so far" bucket
regardless of whether it ever carried a date.

### Related site corrected this run (`3bdd4ac`)
`app/hub/(protected)/clients/[id]/ClientDrawers.tsx:1794-1802` — the "review"
button routed to the most recent block with `s.scheduled_at <= now`, so a block
of delivered-but-undated sessions was skipped in favour of an empty block. Now
it uses `deriveSessionStatus(s) === "completed" || past-scheduled` as the
activity signal, matching the facts page.

## BUG-EF-151 — Full review shows an empty "first check-in" context (0 sessions) when check-ins exist

### Wrong derivation found
`app/hub/(protected)/clients/[id]/review/page.tsx` derived `allCompletedSessions`
via `deriveSessionStatus(s) === "completed"` — three completion sources — but the
**window** that feeds "Delivered" (`completedSessions.length` rendered at
`ReviewFlowClient.tsx:504`), "Recent sessions" and the window label read **only
the `completed_at` column**:
- `hasInDefault` probe (`page.tsx:141`), fallback span sort (`:149`), the
  `reviewWindowSessions` filter (`:163-166`), the fallback label (`:192-196`),
  and both recent-session sorts/maps (`:242-274`).

A session that derives as completed but whose `completed_at` column is NULL
(completion recorded in `data.session_log.completed_at` only — the exact class
`20260818_session_status_model.sql` and `lib/session-transitions.ts:38` document,
and the review page itself feeds `data.session_log` into the derive) was silently
dropped, so the Progress step reported "0 sessions" while check-ins existed.
This is the "window/selection query uses mixed date fields" failure.

### Corrected logic (`app/hub/(protected)/clients/[id]/review/page.tsx`)
Added one normaliser and threaded it through every window use:
```ts
const completedAtOf = (s) => s.completed_at ?? (s.data as any)?.session_log?.completed_at ?? null;
```
Used in the `hasInDefault` probe, the fallback "latest completed" span, the
`reviewWindowSessions` filter, the fallback window label, and the
recent-sessions ordering/mapping. "Delivered" and "Recent sessions" now agree
with the `deriveSessionStatus` verdict.

## BUG-EF-148 — Ongoing (non-block) clients show "0 of 0 sessions used" plus a meaningless denominator

### Disposition: verified already fixed — no change made
Prior commit `a54f359` landed the ongoing/capped split and I confirmed every
surface reads it:

- `app/api/clients/[id]/pot-ledger/route.ts:244,247-257,299-310` — `isOngoing =
  purchased === null`; the walk produces `used` counts and `remaining: null` for
  ongoing; `consumption` carries `used`, `ongoing`, `remaining: null`.
- `app/hub/(protected)/clients/[id]/PotLedger.tsx:84-118` — ongoing renders
  "Ongoing — N sessions used" (no progress bar, no remaining row, no
  "X of M"/"0 of 0" anywhere). Capped path unchanged. `usedPct` guarded against
  purchases null/0 (`:68-70`).
- `components/hub/SessionPotCounter.tsx:32,49-58,92-104` — ongoing shows
  `used` as the hero ("sessions used"), "Ongoing" figure instead of a Purchased
  count, and a completed-only bar (`{completed / Math.max(used,1)}`).
- `app/hub/(protected)/clients/[id]/TrainingSection.tsx:96-101,217-241` —
  ongoing branches to "∞ left / Ongoing package — no session cap", derived from
  `deriveSessionPot` (the pot/ledger model), not block counts.
- `app/hub/(protected)/clients/[id]/ClientRecordHeader.tsx:96-99` — "Ongoing · Paid/Unpaid".
- `app/hub/(protected)/clients/[id]/ClientDrawers.tsx:1100` — "Typed: not set
  used" when `sessionsUsed` is null; counted figures come from `baselineUsed +
  hubUsedCount`.

Write path matches: `deriveSessionPot` (`lib/session-pot.ts:59-115`) counts
completed + charged cancellations over non-sub-sessions via `deriveSessionStatus`;
`used = baseline + completed + charged`. No derivations left against a
"block" count for ongoing clients.

## BUG-EF-145 — Client record Training table shows "No workout applied yet" for sessions that have workouts

### Disposition: verified already fixed — no change made
Prior commit `85525b4` (merge `89e4bd6`) deleted the "broken `pendingQueueItems`
index" positional matching and replaced it with a derivation from real session
rows, which is where workouts actually attach. Verified:

- Workouts attach to `sessions.data` as stamped `versions.{studio,home}` +
  `focus_label` — `lib/programs/delivery.ts:176-189` (programme queue stamp) and
  the template-apply paths `TrainingDrawer.tsx:338-348` / `SessionList.tsx:205-218`.
  Both versions are written together, so `sessionHasNoExercises` (both empty)
  is a faithful "no workout" test.
- `TrainingSection.tsx` `hasWorkout` (`:263-267`) and `sessionsWithWorkouts`
  (`:128-137`) derive from `!isOutlookPlaceholder(s) && !sessionHasNoExercises(s.data) &&
  !isTrainerizeImported(s)` — same chain as the Training drawer — so a session
  with a real stamped workout can no longer read "No workout applied yet".
- `isOutlookPlaceholder` (`lib/session-display.ts:31-50`) still correctly
  distinguishes genuine Outlook auto-created bookings (no workout) from real ones.
- `e05c035`/`ac9a9e1` (BUG-EF-180) kept the "Next" badge and booking-based
  next-session derivation on the same data source.

## BUG-EF-144 — Pot ledger "What moved the balance" ordering is chronologically incorrect

### Disposition: verified already fixed — no change made
`app/api/clients/[id]/pot-ledger/route.ts` builds every event with a rank and
sorts by explicit epoch-ms + rank, not insertion order:

- Every event date normalised through `toIsoTimestamp` at push time
  (`:162-232`), avoiding the raw Postgres text vs `T`-ISO mismatch
  (`lib/pg-timestamp.ts`).
- Deterministic sort `new Date(a.date).getTime() - new Date(b.date).getTime()`
  then `rank` (`:237-241`); ranks: package-start 0 → baseline 1 → session
  activity 2 → extension 3 → expiry 4 (`:25-34`).
- Walk computes `remaining`/`used` in ascending order (`:245-257`), free-cancel
  no-ops are collapsed **before** the newest-first reverse (`:259-297`), so the
  reverse display preserves the chronological total.

The four prior iterated fixes (`ac7d4ab`, `32d1292`, `f9b1d7b`, `10f76fb`) and
the ongoing/capped follow-ups put the sort key on event date throughout. No
residual insertion/id ordering found.

## BUG-EF-139 — Trainerize→programme import drops distinct workouts / keeps duplicates

### Disposition: verified already fixed in code — data repair required, NOT attempted (per contract)
Root cause was phase-blind response assignment in the scraper
(`scripts/import-trainerize-block-data.mjs`): visiting Phase B re-processed
Phase A's `trainingPlan/getWorkoutDefList` response, so Phase B/C stored Phase
A's workouts and the archive/promotion faithfully propagated them as fewer
distinct workouts — see `FINDINGS.md` (root cause, lines 23-34).

Fix landed in `5e12c61` and is verified present:
- `processedResponseCount` declared `:120`, updated after the dash step `:162`.
- The workout-definition step processes only `apiResponses.slice(processedResponseCount)`
  per phase page `:186-212`, and the retry loop applies the same slicing `:489-505`.
- Archive unique keys (`trainerize_training_blocks(client_id, trainerize_phase_id)`,
  `trainerize_workouts(trainerize_block_id, trainerize_workout_id)`) are
  Trainerize-ID based — no name-collision dedup there.

Outstanding, deliberately **not** attempted (code-only lane):
1. **Data repair** of already-imported archive rows — the archive faithfully
   captured the wrong per-phase workouts, so `load-trainerize-history.mjs` +
   `promote-active-trainerize-blocks.mjs` outputs are affected. Re-run the
   corrected scraper for the affected client(s) and re-import, or write a
   repair SQL/migration keyed on phase ID.
2. **Promotion pairing note** (unchanged, documented in `FINDINGS.md:13-14`):
   `promote-active-trainerize-blocks.mjs` `pairGymHomeWorkouts()` matches names
   minus GYM/HOME prefixes / first number — a genuine "GYM Workout 1 - A" vs
   "GYM Workout 1 - B" collision could still drop a distinct workout at
   promotion time even with correct scraper output. Flagged, not changed
   (out of this lane's "scraper/import mapping" contract).

---

## Verification

- `npx tsc --noEmit` (via `node node_modules/typescript/bin/tsc --noEmit`):
  clean at baseline, clean after `9163fa7`, clean after `3aa2a8f`, clean after
  `3bdd4ac`. Working tree clean; nothing pushed.
- No dev servers, browsers, or databases were touched (rules of engagement).
- Working notes file: this one — `LANE-REPORT-truth-cluster.md` (never a bare `LANE-REPORT.md`).