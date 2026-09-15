# LANE-NOTES: u22 — disconnect preserve session_calendar_events

## Bug

`POST /api/integrations/microsoft/disconnect` calls `disconnect()` in `lib/graph-client.ts`, which deleted **all rows** in `session_calendar_events` (the mapping table linking Outlook event IDs to app session IDs). When the trainer reconnects, the inbound sync (`syncOutlookBookings` in `lib/outlook-bookings.ts`) re-fetches every Outlook event, finds the dedup index empty, and creates duplicate bookings for every previously-adopted event.

## What disconnect previously deleted

1. **`session_calendar_events`** — ALL rows (blanket `.delete().neq("event_id", "")` — effectively "delete everything" since `event_id` is always a non-empty string)
2. **`integration_tokens`** — the single Microsoft row (provider = "microsoft") containing OAuth tokens, calendar selection, etc.

## What disconnect now deletes

1. **`integration_tokens`** — the single Microsoft row only. Tokens, calendar selection, and account metadata are removed.
2. **`session_calendar_events`** — **preserved untouched**. No rows are deleted.

## How reconnect dedups (existing, no code change needed)

The inbound sync (`syncOutlookBookings`, `lib/outlook-bookings.ts:374-388`) loads all `session_calendar_events.event_id` values into a `Set` called `managedEventIds`. Any Outlook event whose ID is already in this set is skipped — the event was previously adopted by the app and must not create a duplicate booking.

With the mapping rows preserved across disconnect/reconnect:
- The trainer reconnects → a new `integration_tokens` row is created
- The 15-min cron fires → `syncOutlookBookings()` runs
- `managedEventIds` is populated from the surviving `session_calendar_events` rows
- Previously-adopted events are skipped; only genuinely new Outlook events create new bookings

A secondary guard exists in `materializeBookingSession()` (lines 138-149) which also checks `session_calendar_events` by `event_id` before creating a session, providing defense-in-depth.

## Files changed

| File | Change |
|---|---|
| `lib/graph-client.ts:159-167` | Removed the `session_calendar_events` delete from `disconnect()`. Updated comment. |
| `app/api/integrations/microsoft/disconnect/route.ts:7-14` | Updated doc comment to describe new behaviour (tokens removed, mappings preserved). |

## Verify output

- `tsc --noEmit` — clean (exit 0)
- `vitest run` — 26 files, 280 tests, all pass
- Escape grep: no remaining blanket `session_calendar_events` deletes in `graph-client.ts`
