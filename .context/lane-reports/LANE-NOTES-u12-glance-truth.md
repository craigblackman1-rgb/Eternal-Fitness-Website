# LANE-NOTES-u12-glance-truth

## BUG-EF-184 — Attendance % computed wrongly

**Root cause:** `TrainingSection.tsx` used `pot.used` (which includes `baselineUsed + completed + chargedCancellations`) for both the "X sessions completed" text and the attendance denominator. When `baselineUsed > 0`, the text overcounts completions and the rate is deflated. For Ian Healey (#9) with 1 baseline session and 1 completed session: text said "2 sessions completed" at 50% instead of "1 session completed" at 100%.

**File:** `app/hub/(protected)/clients/[id]/TrainingSection.tsx:96-102,158-165,336`

**Rule now applied:**
1. Derive the session pot from block-scoped sessions (`blockSessions`) not `allSessions`, so completed/used counts reflect only the current block.
2. `sessionsCompleted = pot.completed` (actual hub completions, not pot.used).
3. `attendanceDenominator = pot.completed + pot.chargedCancellations + pot.unreviewedCancellations` — all non-free, non-sub sessions that count against the pot. Baseline sessions are excluded because they have no hub attendance data.

---

## BUG-EF-182 — PWA block label shows wrong block

**Root cause:** `app/hub/m/clients/page.tsx` selected `currentBlock` by stored `status` field first (`active` → `approved` → first), which can be stale. Steph White had an older block (ending Nov) with `status: "active"` and a newer block (sessions 15 & 22 Sept) with upcoming sessions. The stale "active" status won, rendering "Nov 2026" instead of "Sep 2026".

**File:** `app/hub/m/clients/page.tsx:148-152`

**Rule now applied:** Prefer the block containing the nearest upcoming session (filtered by `scheduled_at >= now`, not cancelled, not sub-session). Fall back to status-based selection only when no block has upcoming sessions.

---

## BUG-EF-195 — "Next up" names an in-progress session

**Root cause:** `TrainingSection.tsx` derived `nextSessionWithWorkout` from `upcomingBookings.find(...)`, but `upcomingBookings` included in-progress sessions (`status === "in_progress" || started_at`). A session currently running was labelled "Next up" instead of the truly next upcoming one.

**File:** `app/hub/(protected)/clients/[id]/TrainingSection.tsx:149-154`

**Rule now applied:** The "next" derivation excludes sessions where `status === "in_progress"` or `started_at` is set. "Next" is the first upcoming booking strictly after now (or after the in-progress one), never one whose start has passed or is currently running.

---

## Tests

`lib/__tests__/glance-truth.test.ts` — 12 tests across 3 describe blocks:
- **Attendance % (5 tests):** Ian with/without baseline, mixed completed/charged/unreviewed, zero sessions, sub-session exclusion.
- **PWA block label (3 tests):** stale active vs upcoming sessions, no upcoming fallback, multiple blocks with upcoming sessions.
- **Next session (4 tests):** in-progress skipped, started_at excluded, all completed returns undefined, single upcoming picked.

All 244 tests green. `npx tsc --noEmit` clean.
