# Lane Notes — ef068-u23-booking-dialog-sync-gate

## What was done

Fixed BUG-404e5b6e: the `confirm_before_sync` gate in `confirmBooking()` (lib/booking-availability.ts) was nested inside `if (input.sessionId)`, meaning callers that didn't pass `sessionId` silently bypassed the gate and created Outlook events directly.

## The fix

Moved `getConfirmBeforeSync()` outside the `if (input.sessionId)` block so it is called unconditionally. The gate condition is now `confirmBeforeSync && input.sessionId` — same behavioral outcome for the portal path (sessionId present → queues), but the gate is explicitly evaluated for every caller.

## Callers analysis

| Caller | Passes sessionId? | Gate behavior |
|---|---|---|
| `/api/portal/bookings/confirm` (SlotPicker, PortalBookingClient) | Yes | Queues via calendar_sync_pending_actions ✓ |
| `/api/discovery-call` | No | Gate evaluated, falls through to direct create (FK constraint prevents queuing) |
| `/api/bookings/confirm` (hub) | No | Dead code — no UI callers in the codebase |

## Verification

- `pnpm exec tsc --noEmit`: clean, 0 errors
- Escape grep: no fabricated success signals, no hardcoded numbers, no promises the code doesn't keep
- The fix is a single-file change (lib/booking-availability.ts) with no caller modifications required
