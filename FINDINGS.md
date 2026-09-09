# BUG-EF-139 — Trainerize→programme import drops distinct workouts

## Candidates

### Architecture overview
1. **Scraper** (`scripts/import-trainerize-block-data.mjs`): Logs into Trainerize, navigates phase pages, captures API responses. Writes to `.context/trainerize-import-<clientId>.json`.
2. **Archive import** (`scripts/load-trainerize-history.mjs`): Reads JSON → upserts into `trainerize_training_blocks` + `trainerize_workouts` + `trainerize_exercises` tables.
3. **Promotion** (`scripts/promote-active-trainerize-blocks.mjs`): Reads archive tables → creates hub `blocks`/`sessions` rows.

### Scraper dedup risk — `import-trainerize-block-data.mjs:180-198`
When visiting each phase, the scraper iterates ALL captured API responses (from ALL pages visited so far). If `trainingPlan/getWorkoutDefList` returns a superset of workouts (not just the current phase), the `existing.workouts.length < r.responseBody.workouts.length` check at line 183 would REPLACE a correct smaller set with a larger combined set. This could cause Phase A's entry to gain Phase B's workouts.

### Promotion dedup risk — `promote-active-trainerize-blocks.mjs:61-97`
`pairGymHomeWorkouts()` strips "GYM"/"HOME" prefixes and matches on remaining text or workout number. If two distinct GYM workouts share the same number (e.g. "GYM - Workout 1 - A" and "GYM - Workout 2 - B" both extracting number "1" via the regex), only one would pair with a HOME counterpart, leaving the other standalone. The regex `workout\s*(\d+)` at line 67-69 is the likely culprit — it extracts the first number from the name, which may not be unique.

### Archive unique keys — no dedup risk
- `trainerize_training_blocks`: unique on `(client_id, trainerize_phase_id)` — Trainerize ID, not name.
- `trainerize_workouts`: unique on `(trainerize_block_id, trainerize_workout_id)` — Trainerize ID, not name.

### programmes system not involved in direct import
The `programs`/`program_slots` tables are created via the paste-parse UI, not via a Trainerize data import script. The `source: 'trainerize_import'` field exists in the TypeScript type but no code sets it on the `programs` table.
