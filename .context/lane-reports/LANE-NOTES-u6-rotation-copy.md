# Lane Notes — u6-rotation-copy

**Unit:** CR-EF-127 residual language sweep
**Date:** 2026-09-14
**Branch:** lane/ef-u6-rotation-copy off origin/main 4a3c0b4

## What changed

Replaced "in rotation" with "workout slot(s)" in two programme-builder header template strings:

- `app/hub/(protected)/programs/[id]/ProgramBuilderClient.tsx:962` — assigned-client variant
- `app/hub/(protected)/programs/[id]/ProgramBuilderClient.tsx:963` — library-programme variant

Before:
```
`Assigned to ${assignedClient.name} · ${slotCount} slot${slotCount !== 1 ? "s" : ""} in rotation · ${totalSessions} sessions`
`Library programme · ${slotCount} slot${slotCount !== 1 ? "s" : ""} in rotation · ${totalSessions} sessions`
```

After:
```
`Assigned to ${assignedClient.name} · ${slotCount} workout slot${slotCount !== 1 ? "s" : ""} · ${totalSessions} sessions`
`Library programme · ${slotCount} workout slot${slotCount !== 1 ? "s" : ""} · ${totalSessions} sessions`
```

## Sweep results

`git grep -n -i -E '(workout pool|rotation order|pool size|[^a-z_]pool[^a-z_]|[^a-z_]rotation[^a-z_])' -- 'app/hub/**/*.tsx'`

**0 rendered-string hits.** All remaining matches are:

| File | Line | Type | Content |
|---|---|---|---|
| ProgramQueueMap.tsx | 56 | comment | `// 1-based slot position in the rotation` |
| blocks/.../page.tsx | 403 | comment | `// session_number (which drives rotation)` |
| clients/page.tsx | 23,40,52,60,72,88,95,103,113 | identifier | `const pool = getPool()` and `pool` argument refs |
| page.tsx (hub root) | 20,33,50,64,72,85,103,119,134,141 | comment + identifier | Comment about pool; `const pool = getPool()` and refs |
| settings/page.tsx | 42,57,60 | identifier | `const pool = getPool()` and `pool.query(...)` |
| settings/studio-equipment/page.tsx | 24,25,30 | identifier | `const pool = getPool()` and `pool.query(...)` |
| ClientModeView.tsx | 344,397,437 | comment | `/* Pool view */`, pool slot position comments |
| ClientTabBar.tsx | 10,51 | identifier | `ICO.pool` (icon object key), `ICO.pool` (icon ref) |
| page.tsx (client detail) | 436,437,441,481 | comment + identifier | Pool view comments, `poolWorkouts` variable refs |
| train/[sessionId]/page.tsx | 60,63,71,82 | identifier | `const pool = getPool()` and `pool.query(...)` |

All are code identifiers (variable/function names) or comments — none are rendered to users.

## Verification

- `npx tsc --noEmit` — passed (no errors)
- `git diff --stat` — 1 file changed: `ProgramBuilderClient.tsx` (2 insertions, 2 deletions)
- Restricted grep for rendered strings in `app/hub` — 0 hits
