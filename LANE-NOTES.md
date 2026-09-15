# LANE-NOTES — ef-u10-pwa-today-parity fix pass

## Fix pass 2026-09-15

### BUG-EF-174 (Today alerts) — genuinely unified, leave as-is
No changes needed. Both surfaces already call `getTodayAlertsAndWeekCount()` from `lib/hub/alerts.ts`.

### BUG-EF-176 (Money queue) — real bug: desktop had its own 5-category queue

**Before:** Desktop `cashflow/page.tsx` built a 5-category action queue locally (block ending soon, draft invoices, overdue unmatched, findSuggestedMatches recon, no-rate clients) and ignored `summary.actionQueue`. PWA `money/page.tsx` called `getMoneySummary()` but the helper only had 3 categories (no block-ending, old recon heuristic).

**After:** Both surfaces now call `getMoneySummary()` from `lib/hub/money-summary.ts`. The helper includes all 5 categories. Desktop renders `summary.actionQueue` directly. ~120 lines of duplicated queue-building code removed from `cashflow/page.tsx`.

**Single helper both surfaces now call:** `getMoneySummary()` in `lib/hub/money-summary.ts`

### BUG-EF-181 (Client needs) — real bug: missing columns + desktop had its own query

**Before:** `getClientNeeds()` in `lib/hub/client-needs.ts` omitted `band_set_id` and `annual_review_due_date` from the clients SELECT, so `missingBandSet` was always true and the annual-review flag never fired on PWA. Desktop `clients/[id]/page.tsx` built its own NeedsYouInput with ~70 lines of duplicated computation (tasks, draft blocks, undated sessions, mismatch, unpaid blocks, draft invoices).

**After:** `getClientNeeds()` now selects `band_set_id` and `annual_review_due_date`. Uses `deriveSessionPot()` for `sessionsRemaining` (same utility desktop uses). Desktop page calls `getClientNeeds()` and feeds its output to the shell. `missingBandSet` fixed to check `band_set_id` (was `band_set`).

**Single helper both surfaces now call:** `getClientNeeds()` in `lib/hub/client-needs.ts`

### Error states (all three PWA screens)

All three PWA screens (`page.tsx`, `money/page.tsx`, `clients/[id]/page.tsx`) previously swallowed helper errors into empty/zero states, causing screens to show "All clear" when data was simply absent. Now pass explicit error flags and render "Could not load — pull to refresh" when the helper throws. "All clear" only renders when the helper returned successfully with zero items.
