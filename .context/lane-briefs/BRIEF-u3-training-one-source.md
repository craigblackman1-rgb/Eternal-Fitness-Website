# Lane: u3-training-one-source — BUG-EF-145 (f45fadb0)
WO: wo-ef-unified-training-2026-09-08 u3 · branch lane/lane-u3-training-one-source · model opencode-go/mimo-v2.5

## GOAL
On the client record, the left Training table and the Manage training drawer must AGREE about which booked
dates have a workout. Live evidence (Nathan Wadey, /hub/clients/20, a Trainerize-imported programme): table rows
from Wed 16 Sept say "No workout applied yet"; the drawer's programme map shows those same dates as Workout A/B
position N, and its header says "All 6 booked dates have a workout". One of them is lying.

## ROOT CAUSE (verified in code — start here)
Three different definitions of "this session has a workout":
1. `app/hub/(protected)/clients/[id]/TrainingSection.tsx` ~L263 `hasWorkout = !isOutlookPlaceholder && !sessionHasNoExercises(data) && !isTrainerizeImported`.
2. `app/hub/(protected)/clients/[id]/TrainingDrawer.tsx` L183 `nothingAppliedCount` — same three predicates (so header text agrees with the table),
   BUT
3. `TrainingDrawer.tsx` L190-282 `mapData` marks a position "applied" purely because `posToDate[pos]` exists — i.e. the session
   has a `program_slot_id` + `week`. Exercises/Trainerize are never consulted. That map is the surface reading "Workout A/B position N".
Also L484 repeats predicate (1) inline a fourth time.

## MUST
- Create ONE exported predicate in `lib/session-display.ts` (e.g. `sessionHasWorkout(session, slot?)`) that decides "has a workout applied" and
  use it in ALL FOUR places above (table row, nothingAppliedCount, mapData "applied" state, L484). No surface may keep its own inline rule.
- Decision to make and document at the top of the new function: a Trainerize-imported session that resolves to a programme slot with
  exercises IS a workout (the import is real content, now deduped by BUG-EF-139). `isTrainerizeImported` may still hide the
  "imported from Trainerize" *label*, but must not by itself turn a real workout into "No workout applied yet". Outlook placeholders and
  sessions whose data has no exercises remain "nothing applied".
- The table's "Workout applied" cell shows the workout name + `Position N` whenever the shared predicate says yes.
- Fix the alignment issue on the Training table `.drow` rows (the three columns drow-d / drow-w / drow-s must line up with the header row;
  check the CSS that defines them and the `<small>` wrapping inside drow-w).
- Unit tests: `lib/__tests__/session-has-workout.test.ts` covering: Outlook placeholder -> false; empty exercises -> false;
  Trainerize-imported with slot + exercises -> true; normal session with exercises -> true; slot present but no exercises -> false.
- Write lane notes to `.context/lane-reports/LANE-NOTES-u3-training-one-source.md`: the rule you chose, the four call sites, before/after
  for the Nathan Wadey case reasoned from code.
- COMMIT (`git add -A && git commit`). Do NOT push.

## FORBIDDEN
- Any file outside `app/hub/(protected)/clients/[id]/TrainingSection.tsx`, `TrainingDrawer.tsx`, `lib/session-display.ts`, the new test,
  the lane notes, and the CSS file that defines `.drow` (name it in the notes).
- No API routes, no migrations, no ClientDrawers.tsx, no ClientRecordShell.tsx, no dev server, no browser, no installs.
- Do not change how `programState`/`blockSessions` are fetched.

## VERIFY (run yourself, paste output in notes)
- `npx tsc --noEmit` clean.
- `npx vitest run lib/__tests__/session-has-workout.test.ts` green.
- `grep -n "sessionHasNoExercises\|isTrainerizeImported" "app/hub/(protected)/clients/[id]/TrainingSection.tsx" "app/hub/(protected)/clients/[id]/TrainingDrawer.tsx"`
  — must show ZERO inline "has workout" rules; only the shared predicate is called.
Real Nathan Wadey table-vs-drawer check is Claude-side after merge.
