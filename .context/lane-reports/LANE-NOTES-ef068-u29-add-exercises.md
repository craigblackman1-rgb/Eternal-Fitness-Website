# Lane Notes — ef068-u29-add-exercises

## What was done
Added two plank progression exercises to the exercise library for Nathan Wadey's 12-week block:
- **Long-Lever Plank** (week 8) — extends arms forward to increase lever length, targeting deep core
- **Weighted Plank** (week 10) — adds weight plate to standard plank for progression

## Migration file
`db/migrations/20260916_exercises_plank_variants.sql`

Both exercises are inserted with:
- `source: 'custom'` (not from Trainerize or original library)
- Muscle group: Abs
- Equipment: mat (and weight plate for Weighted Plank)
- Difficulty: 3 (intermediate-advanced, appropriate for weeks 8/10 of a 12-week block)
- YouTube video links for form reference

## Verification
- SQL syntax validated against existing migration patterns (20260710_exercises.sql, 20260802_exercises_trainerize_refresh.sql)
- Column order matches existing INSERT statements exactly
- Both exercise names and video URLs present in the INSERT
- No TypeScript touched, no build needed
