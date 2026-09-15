# LANE-NOTES-u11-session-chips

## Fix-up 2026-09-15

### Blocker 1: Completed session pill shows wrong class

**File:** `app/hub/m/train/[sessionId]/TrainScreen.tsx:1247`

**Root cause:** `topStatusLabel` (line 1239) checks `sessionCompleted` first and returns "Completed", but `topStatusClass` (line 1247) only derives from `doneExCount === allSets.length` and `started`. A completed session with unlogged exercises shows the text "Completed" on a rose/neutral "in progress" pill because `sessionCompleted` is true but not all exercises are logged.

**Fix:** Added `sessionCompleted` check at the top of `topStatusClass`, same precedence as the label. CSS `.top-status.done` variant already existed in `mobile.css:256` using success tint tokens.

### Blocker 2: Chip vocabulary inconsistency — 'Scheduled' vs 'Booked'

**Files:** `lib/session-chip.ts:96`, `app/hub/(protected)/schedule/CalendarSpine.tsx:402`

**Root cause:** The lane renamed 'Applied' to 'Scheduled' for the chip vocabulary, but desktop already uses 'Booked' for the same underlying scheduled status in `WeekView.tsx:188` and `SessionDrawer.tsx:48`. Ops decision 2026-09-15: the word is 'Booked' everywhere.

**Fix:**
1. `lib/session-chip.ts:96` — changed label from `"Scheduled"` to `"Booked"` (variant `"scheduled"` unchanged)
2. `CalendarSpine.tsx:402` — changed legend label from `"Scheduled"` to `"Booked"`
3. `WeekView.tsx:188` and `SessionDrawer.tsx:48` already said "Booked" — no change needed
