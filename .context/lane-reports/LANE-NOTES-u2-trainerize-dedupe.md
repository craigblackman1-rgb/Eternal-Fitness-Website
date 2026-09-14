# LANE NOTES — u2-trainerize-dedupe

**Work Order:** wo-ef-unified-training-2026-09-08 u2
**Bug:** BUG-EF-139 (cc7caeed)
**Branch:** lane/lane-u2-trainerize-dedupe

## What changed

### The dedupe location

`lib/programs/dedupe-workouts.ts` (new file) — a pure function `dedupeWorkoutsByContent<T extends ParsedSlot>(slots: T[]): T[]`.

Wired into `lib/programs/parse.ts` in both code paths of `parseProgram()`:
1. **Parallel per-slot parse path** (line ~406): after `resolveCrossSlotReferences(slots)`, before `assembleProgram()`.
2. **Whole-text fallback path** (line ~467): after `normalizeProgram(parsed)`, before returning.

### Content-key definition

The content key is built by concatenating, for each section in order:

```
section.kind ~ section.label ~ section.rounds ~ section.rest ~
  exercise_name | per_side | sets | reps | weight | duration | notes (joined by ;)
```

Sections are separated by `||`. All string values are normalised via `norm()`:
- trim leading/trailing whitespace
- collapse internal whitespace runs to single space
- lowercase

Exercise names like `"  Barbell  Back  Squat  "` and `"barbell back squat"` produce the same key. Whitespace/case-only differences in any field count as identical. Different sets/reps/weight/duration/notes produce different keys.

### Copy-suffix detection

Regex: `/\s*[-(]?\s*copy\s*\d*\)?$/i`

Matches: "Workout A - Copy", "Workout A (copy)", "Workout A - Copy 2", "Workout A (copy 3)"

Per group of duplicates: keep the entry whose label does NOT match the Copy regex. If both are non-copy names, keep the first (preserving original order).

### DB constraint check

`program_slots` has `UNIQUE (program_id, position)` but **no label uniqueness constraint**. Two distinct workouts with the same label are fine — they just need different positions. Therefore no numeric suffix needs to be appended to display names for distinct-content same-label workouts.

## Tests

11 tests in `lib/__tests__/dedupe-workouts.test.ts`:
- (a) Same content, "X" + "X - Copy" → 1 kept, named "X"
- (a-variant) Copy arrives first → still keeps original name
- (b) Same name, different content → 2 kept
- (c) Three-way: two identical + one distinct → 2 kept
- (d) Order preserved
- (e) Whitespace/case-only differences → identical
- Section structure matters (warmup/superset/cooldown)
- Different sets/reps produce different keys
- Empty input → empty array
- Single slot → passthrough
- Multiple copies all collapse to one

## Verification with Nathan Wadey export

To verify with the real Trainerize export:

1. Import Nathan Wadey's Trainerize programme via the hub import page (paste the export text, click Parse).
2. After saving, check the `program_slots` table:
   ```sql
   SELECT position, label, jsonb_array_length(data->'sections') as section_count
   FROM program_slots
   WHERE program_id = '<saved-program-id>'
   ORDER BY position;
   ```
3. Expected: imported workout count = number of distinct workouts in the source (no duplicates from Copy entries, no collapsed distinct workouts).
4. Visually confirm in the hub that each slot shows different exercises where the source had different workouts, and that Copy-named entries are absent.

## Verification results

- `npx tsc --noEmit` — clean (0 errors)
- `npx vitest run` — 255 tests passed (244 existing + 11 new), 0 failed
