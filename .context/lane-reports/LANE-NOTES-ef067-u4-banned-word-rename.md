# Lane: ef067-u4-banned-word-rename

**WO:** wo-ef-unified-training-2026-09-08 · Unit: u4 · Model: opencode-go/mimo-v2.5

## What happened

Renamed the banned-word surface in `hub-block-slots-pool.html` per CR-EF-127. The three banned terms:
- **"Workout pool"** → **"Workouts"** (section heading, note copy, proto-bar title, index.html card label, client page nav links)
- **"Rotation order"** → **"Workout order"** (section heading, subtitle, button toast, JS toast messages)
- **"Pool size is independent of block size"** → **"The workout list is separate from the session count"** (pool footer note)

Also updated JS comments and HTML comments that contained the banned words.

## Scope

Files changed (all in `D:\apps\design-systems`, committed to that repo as `c5aacf4`):
1. `ef-control-hub/desktop/training/hub-block-slots-pool.html` — primary mockup, all three banned terms
2. `ef-control-hub/index.html` — card label "Block — slots & pool" → "Block — slots & workouts"
3. `ef-control-hub/desktop/clients/hub-client-book-sessions.html` — nav link "Slots & workout pool" → "Slots & workouts"
4. `ef-control-hub/desktop/clients/hub-client-session-pot.html` — nav link + toast message

## What was NOT touched

- CSS class names (`.rot-*`, `.pool-*`, `.pool-item`, etc.) — internal implementation, not vocabulary
- JS variable names (`POOL`, `rotationQueue()`, etc.) — internal implementation
- `data-od-id` attributes (`rotation-ribbon`, `workout-pool`) — internal identifiers
- `.context/` documentation files in the eternal-fitness-website repo — these reference the banned words in historical context/analysis, not user-facing copy
- Mobile mockup `hub-m-pool-variants.html` — does not reference hub-block-slots-pool.html, out of scope per "FORBIDDEN: do not touch unrelated copy"
- Archived mockups in `_archive/` — historical records

## Verification

- `Select-String` confirms 0 hits for "workout pool", "rotation order", "Pool size is independent" in all 4 affected files
- `pnpm exec tsc --noEmit` clean (no source code was changed)
- Design-system changes committed to `D:\apps\design-systems` repo, not the eternal-fitness-website worktree (the mockup files live there)
