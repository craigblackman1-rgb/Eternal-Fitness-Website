# Lane Notes — ef049-u1-promote-staging-fixes

## Summary

Attempted to cherry-pick 5 staging-verified fixes (6 commits) onto a branch based on origin/main.

## Result

**1 of 5 targets landed.** The other 4 were already present on HEAD.

## Per-commit breakdown

| Commit | SHA | Result |
|--------|-----|--------|
| schedule guards | e914462 | **Landed** (5947428). Conflicts resolved: HEAD had a more complete off-day implementation including `offDayMode` (today/booked), `startedAt`/`cancelledAt` fields, and `plannedEntries` support. Kept HEAD's superset. |
| sessions-query | d2ae786 | **Skipped** — empty commit. Changes already on HEAD. |
| error-surfacing | 009f293 | **Skipped** — empty commit. Changes already on HEAD (TrainScreen uses `completeSession` helper which handles 409s internally). |
| band-equipment | 91e890b | **Skipped** — empty commit. Changes already on HEAD. |
| lb-kg conversion | 9d454c1 | **Skipped** — conflicts aborted. HEAD already has `displayWeight` from `@/lib/workout/helpers` and `saveSetLog` already handles `toKg` with `displayUnit` parameter. |
| lb-kg rounding | 8ec286a | **Skipped** — superseded by HEAD's `displayWeight` implementation. |

## Key observation

HEAD (origin/main) already contains all the functionality from these staging fixes, having been refactored into shared modules (`lib/workout/save-set-log.ts`, `lib/workout/helpers.ts`, `lib/units.ts`). The staging commits predate this refactoring.

## Verification

- `pnpm exec tsc --noEmit`: clean (0 errors)
- `git log --oneline`: 5947428 present, branch clean
