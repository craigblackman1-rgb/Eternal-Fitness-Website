# Lane Notes — ef068-u11-pot-ledger-truth

## Status: Already fixed

Both BUG-EF-144 and BUG-EF-148 were already resolved in commit `4a3c0b4` by a prior session
on the same work order unit (wo-ef-consolidated u11). No new code changes were needed.

## What was fixed (verified)

### BUG-EF-144 — Chronological ordering
- `lib/pot-ledger.ts` sorts events by `(date, rank)` ascending, then reverses for desc display
- Package start uses `start_date` (purchase date), not earliest session
- Baseline uses `pot_baseline_at` directly (no +1ms hack)
- Free cancels are collapsed into a single `× N` row
- Tests confirm correct ordering at `lib/__tests__/pot-ledger-order.test.ts`

### BUG-EF-148 — Ongoing clients "0 of 0 sessions used"
- `route.ts` passes `null` for `purchased` when `sessions_purchased` is null
- `buildPotLedger` derives `isOngoing = purchased === null`, uses `used` counter instead of `remaining`
- `PotLedger.tsx` shows "Ongoing — X sessions used" for ongoing clients (not "X of Y")
- `consumption.remaining` is `null` for ongoing, not `0`
- Tests confirm at `lib/__tests__/pot-ledger-order.test.ts` lines 206–298

## Verification
- 26/26 unit tests pass (pot-ledger-order: 16, session-pot: 10)
- tsc clean (0 errors)
- Escape grep: 0 hits for "0 of 0" in source
