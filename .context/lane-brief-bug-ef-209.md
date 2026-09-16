# Lane brief — BUG-EF-209 (hotfix): outbound Outlook sync leaks past the CALENDAR_OUTBOUND_SYNC guard

## Problem
Outbound push to Esther's Outlook is meant to be OFF unless env `CALENDAR_OUTBOUND_SYNC === "enabled"`.
Today the only place that checks it is `app/api/cron/sync-calendar/route.ts`. Every other caller pushes unconditionally:

- `app/api/integrations/microsoft/status/route.ts` POST → `syncCalendar()` (fired a full push on 2026-09-16 when the calendar was re-selected: 12 events created, 36 of Esther's recurring occurrences overwritten)
- `syncSessionCalendarEvent()` callers: `app/api/clients/[id]/book-sessions/route.ts` (x2), `app/api/clients/[id]/shift-schedule/route.ts`, `app/api/hub/availability/move-clashing-session/route.ts`, `app/api/sessions/[id]/route.ts`

## Fix (all in `lib/calendar-sync.ts`, so every caller is covered at once)
1. Add and export `outboundSyncEnabled(): boolean` → `process.env.CALENDAR_OUTBOUND_SYNC === "enabled"`.
2. At the top of `syncCalendar()`: if not enabled, return the result with `skipped: "outbound sync disabled (CALENDAR_OUTBOUND_SYNC)"` and do nothing else — no Graph calls, no `calendar_sync_pending_actions` inserts.
3. At the top of `syncSessionCalendarEvent()`: if not enabled, return immediately — no Graph calls, no pending-action inserts.
4. `app/api/cron/sync-calendar/route.ts`: replace its inline env check with `outboundSyncEnabled()`; keep the existing `{ outboundSync: "skipped" }` response shape.
5. `app/api/integrations/microsoft/status/route.ts` POST: keep `setCalendar()`; call `syncCalendar()` only when `outboundSyncEnabled()`, otherwise respond `{ success: true, sync: { skipped: "outbound sync disabled" } }`.
6. Do NOT change inbound (`lib/outlook-bookings.ts`, `syncOutlookBookings`) — it must keep running.
7. Do NOT change any UI files.

## Verify (lane)
- `pnpm tsc --noEmit` passes.
- `grep -rn "syncCalendar(\|syncSessionCalendarEvent(" app lib` — every call site is either inside `lib/calendar-sync.ts` or now reaches a function that returns early when disabled.
- Add a small unit test if the repo has a test runner for lib (check `package.json`); otherwise skip tests — do not add a runner.

## Rules
- Commit early on this branch (`fix/bug-ef-209-outbound-guard`), conventional message `fix(calendar): gate every outbound Outlook push behind CALENDAR_OUTBOUND_SYNC (BUG-EF-209)`.
- Do not run dev servers or browser automation. Do not push.
- Write literal characters in any string, never `\uXXXX` escapes.
