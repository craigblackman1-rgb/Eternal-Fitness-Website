# Lane Notes — ef070-u14-timestamptz-iso

## What was done

The pg type parsers in `lib/pg-client.ts` already normalise column-level
timestamptz values (types 1114, 1184, 1082) to strict ISO-8601 via
`toIsoTimestamp()`. But timestamps nested inside JSONB columns bypass those
parsers — Postgres serialises JSONB as-is, including the non-ISO
`2026-09-03 18:00:00+01` form. V8 parses that leniently; WebKit returns
Invalid Date. Every browser on iOS is WebKit.

The sole JSONB column carrying a timestamp is `sessions.data`, which contains
`data.session_log.completed_at`.

## Fix

Added `normaliseSessionData()` to `lib/pg-timestamp.ts` — a typed helper
that normalises `data.session_log.completed_at` on any session-shaped object.
Applied at every server-side call site that returns session objects to the
client (7 files, 8 return paths).

## Files touched

| File | What changed |
|---|---|
| `lib/pg-timestamp.ts` | Added `normaliseSessionData()` helper |
| `app/api/sessions/[id]/route.ts` | GET and PATCH returns |
| `app/api/clients/[id]/sessions/latest-completed/route.ts` | `completed_at` field |
| `app/api/clients/[id]/route.ts` | `_lastSessionDate` field |
| `app/api/blocks/[id]/sessions/route.ts` | GET single (2 paths), batch, POST |
| `app/api/outlook-bookings/[id]/confirm/route.ts` | session in response |
| `app/api/hub/availability/move-clashing-session/route.ts` | session in response |
| `lib/portal-data.ts` | `getTrainingPlan()` sessions |

## Not changed (already normalised)

- `app/hub/(protected)/clients/[id]/page.tsx` — already normalises `log.completed_at` at lines 104-108
- `app/hub/m/clients/[id]/page.tsx` — already normalises at lines 189-193
- `app/api/clients/[id]/sessions/completed/route.ts` — already uses `toIsoTimestamp()` at line 58
- `lib/pot-ledger.ts` — already uses `toIsoTimestamp()` throughout
- `app/api/clients/[id]/add-workout/route.ts` — does not return session objects (only derived fields)

## Scope note

The initial audit identified 9 call sites. After deep inspection, 8 were
confirmed as genuine gaps. The add-workout route was excluded because its GET
returns only derived fields (`sessionCount`, `nextScheduledSession.date` from
the `scheduled_at` column which is already normalised by the type parser), not
session objects with the JSONB blob.
