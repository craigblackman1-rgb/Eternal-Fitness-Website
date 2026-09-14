# Lane Notes: u3-training-one-source — BUG-EF-145

## The rule chosen

`sessionHasWorkout(session, slot?)` in `lib/session-display.ts` is the single source of truth.

Decision: a Trainerize-imported session that resolves to a programme slot with exercises IS a workout
(the import is real content, now deduped by BUG-EF-139). `isTrainerizeImported` may still hide the
"imported from Trainerize" label, but must not by itself turn a real workout into "No workout applied yet".

Three-tier evaluation:
1. Outlook placeholder → false (always "nothing applied")
2. No exercises in any version → false (always "nothing applied")
3. Trainerize-imported with no slot and no `program_slot_id` → false
4. Otherwise → true

## The four call sites (before → after)

### 1. TrainingSection.tsx — `sessionsWithWorkouts` filter (~L136)

**Before:** inline `!isOutlookPlaceholder(s) && !sessionHasNoExercises(s.data) && !isTrainerizeImported(s)`

**After:** `sessionHasWorkout(s, programState?.slots.find(...))`

### 2. TrainingSection.tsx — `nextSessionWithWorkout` find (~L153)

**Before:** inline same three predicates

**After:** `sessionHasWorkout(s, programState?.slots.find(...))`

### 3. TrainingSection.tsx — row-level `hasWorkout` in bookings map (~L280)

**Before:** inline same three predicates, slot computed after hasWorkout

**After:** slot computed first, then `sessionHasWorkout(booking, slot)`

### 4. TrainingDrawer.tsx — `nothingAppliedCount` filter (~L183)

**Before:** inline `isOutlookPlaceholder(s) || sessionHasNoExercises(s.data) || isTrainerizeImported(s)`

**After:** `!sessionHasWorkout(s)`

### 5. TrainingDrawer.tsx — row-level `hasWorkout` in visibleSessions map (~L483)

**Before:** inline `!isOutlookPlaceholder(s) && !sessionHasNoExercises(s.data) && !isTrainerizeImported(s)`

**After:** `sessionHasWorkout(s, slot)`

### 6. TrainingDrawer.tsx — mapData cell state (L270)

**Before:** `dateStr` existence alone → `state = "applied"` (the root cause of the drawer lying)

**After:** looks up the session for that position, checks `sessionHasWorkout(cellSession)` → `state = "applied"` only if true, else `"empty"`

## Nathan Wadey case — before/after reasoned from code

**Scenario:** Nathan Wadey, `/hub/clients/20`. Trainerize-imported programme. Sessions Wed 16 Sept onward
have `coaching_notes: "Imported from Trainerize — ..."`, `program_slot_id` pointing to a slot, `week` set,
and exercises in `data.versions.studio.main_block`.

### Before (the bug)

- **Table (TrainingSection.tsx):** The inline predicate included `!isTrainerizeImported(s)`, which returned
  `true` for these sessions → `hasWorkout = false` → "No workout applied yet" shown.
- **Drawer header (TrainingDrawer.tsx):** `nothingAppliedCount` used the same inline predicate → counted
  these sessions as "nothing applied" → header showed "X of 6 booked dates have nothing applied".
  BUT the drawer map (mapData) marked them as "applied" because `posToDate[pos]` existed → header said
  "All 6 booked dates have a workout" (when nothingAppliedCount was 0).
- **Result:** Table said "No workout applied yet", drawer said "All 6 have a workout". Contradiction.

### After (the fix)

- **Table:** `sessionHasWorkout(s, slot)` — slot exists (from programState), exercises exist → returns
  `true` → workout name + "Position N" shown.
- **Drawer header:** `!sessionHasWorkout(s)` → `false` for these sessions → nothingAppliedCount stays 0
  → header says "All 6 booked dates have a workout".
- **Drawer map:** `sessionHasWorkout(cellSession)` → `true` → `state = "applied"`.
- **Result:** Both surfaces agree. All 6 booked dates show a workout applied.

## CSS fix — drow alignment

File: `app/globals.css` (the `.tsec` rules starting around L1568)

Added `line-height: 1.35` to `.tsec .drow-d small` and `.tsec .drow-w small` to ensure consistent
row heights between the header row (no `<small>` elements) and data rows (which have `<small>` for
relative dates and exercise counts). Without explicit line-height, inherited values caused uneven
spacing that made the three-column layout misalign.

## Verification

- `npx tsc --noEmit` — clean (0 errors)
- `npx vitest run lib/__tests__/session-has-workout.test.ts` — 9/9 green
- `findstr /n "sessionHasNoExercises isTrainerizeImported" TrainingSection.tsx TrainingDrawer.tsx` — zero matches (no inline rules remain)

## Files changed

| File | Change |
|---|---|
| `lib/session-display.ts` | Added `sessionHasWorkout` export |
| `app/hub/(protected)/clients/[id]/TrainingSection.tsx` | 3 inline predicates → `sessionHasWorkout`; removed unused imports |
| `app/hub/(protected)/clients/[id]/TrainingDrawer.tsx` | 3 inline predicates → `sessionHasWorkout`; mapData dateStr → sessionHasWorkout; removed unused imports |
| `app/globals.css` | Added `line-height: 1.35` to `.tsec .drow-d small` and `.tsec .drow-w small` |
| `lib/__tests__/session-has-workout.test.ts` | New — 9 test cases |
