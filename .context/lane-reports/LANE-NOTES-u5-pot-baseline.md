# Lane u5-pot-baseline — LANE-NOTES

## What changed

**Unit tests only.** The code fix was already applied in commit `202fd18` (fix(pot): subtract pot_baseline_used so remaining sessions are truthful (BUG-EF-142)) and two follow-up commits (`2fbb035`, `523632b`).

Added `lib/__tests__/session-pot.test.ts` — 10 unit tests covering:

- **Emma fixture** (baseline_used = 5, purchased = 24, 8 completed + 1 charged cancel): proves remaining = 24 - (5 + 8 + 1) = 10, and that ignoring baseline_used would overstate remaining by 5.
- **Ian fixture** (baseline_used = 0 / undefined, purchased = 12, 3 completed): proves remaining = 9, and that default parameter produces same result as explicit 0.
- Sub-session exclusion (CR-EF-101): verifies sub-sessions are not counted.
- Estimated remaining when purchased is null: confirms baseline NOT applied to row-count estimate.
- Empty session list: all-zero counts with baseline correctly applied to remaining.
- Clamping: remaining never goes below 0.

## Verification

- `pnpm vitest run lib/__tests__/session-pot.test.ts` — 10/10 passed
- `pnpm tsc --noEmit` — exit 0, no errors (only the new test file was type-checked; pre-existing `ignoreBuildErrors: true` means `next build` skips this, but `tsc --noEmit` explicitly checked and passed)

## PWA pot display share path — report

### All `deriveSessionPot` callers pass `pot_baseline_used`

Every caller in the codebase already passes `baselineUsed` as the third argument:

| Caller | File:Line | How baselineUsed is sourced |
|--------|-----------|---------------------------|
| Pot ledger API | `app/api/clients/[id]/pot-ledger/route.ts:90` | `(client as any).pot_baseline_used ?? 0` |
| Carry-over API | `app/api/blocks/[id]/carry-over/route.ts:63` | `(client as any)?.pot_baseline_used ?? 0` |
| Cancellation data API | `app/api/sessions/cancellation-data/route.ts:76` | `client.baselineUsed` |
| Desktop client detail | `app/hub/(protected)/clients/[id]/page.tsx:98` | `baselineUsed` (computed from client record) |
| Desktop TrainingSection | `app/hub/(protected)/clients/[id]/TrainingSection.tsx:99` | `baselineUsed` |
| Desktop review page | `app/hub/(protected)/clients/[id]/review/page.tsx:98` | `client.pot_baseline_used ?? 0` |
| Desktop new program page | `app/hub/(protected)/clients/[id]/programs/new/page.tsx:36` | `(client as any).pot_baseline_used ?? 0` |
| Desktop clients list | `app/hub/(protected)/clients/page.tsx:218` | `baselineUsed` |
| Desktop cashflow | `app/hub/(protected)/cashflow/page.tsx:173` | `c.pot_baseline_used ?? 0` |
| Desktop block overview | `app/hub/(protected)/clients/[id]/blocks/[blockId]/BlockOverviewClient.tsx:393` | `baselineUsed` |
| Desktop session review | `app/hub/(protected)/sessions/review/page.tsx:92` | `client.baselineUsed` |
| Desktop schedule triage | `app/hub/(protected)/schedule/triage/TriageScreen.tsx:147` | (receives pot from parent) |
| CancelSessionDialog | `components/hub/CancelSessionDialog.tsx:46` | `baselineUsed` |
| CancellationReview | `components/hub/CancellationReview.tsx:96,147` | `client.baselineUsed` |
| **PWA client detail** | `app/hub/m/clients/[id]/page.tsx:418` | `(row as any).pot_baseline_used ?? 0` |
| Portal book page | `app/portal/(protected)/book/page.tsx:70` | `(clientExtra as any)?.pot_baseline_used ?? 0` |
| Portal sessions page | `app/portal/(protected)/sessions/page.tsx:78` | `(clientExtra as any)?.pot_baseline_used ?? 0` |

### PWA pot displays share the same derive path

The PWA pot display (hub bugs fe582065, 08bef118, 9d5016f1) goes through the **same** `deriveSessionPot` function:

- **PWA client detail page** (`app/hub/m/clients/[id]/page.tsx:408-418`): calls `deriveSessionPot(...)` directly, passing `(row as any).pot_baseline_used ?? 0` as the third argument. The result is shaped into `potView` and passed to `ClientModeView`.
- **PWA ClientModeView** (`app/hub/m/clients/[id]/ClientModeView.tsx:361-384`): renders `potView.remaining` and `potView.used` — purely a display consumer of the data derived upstream.
- **PWA MoveCancelSheet** (`app/hub/m/train/[sessionId]/MoveCancelSheet.tsx:95-113`): fetches from `/api/clients/${clientNumber}/pot-ledger`, which calls `deriveSessionPot` at `pot-ledger/route.ts:90` with baseline. The sheet uses `data.consumption.remaining` from that API response.

**Conclusion:** The PWA pot displays share the single derive path. They do NOT have their own arithmetic. Fixing `deriveSessionPot` fixes all surfaces — hub desktop, PWA, and portal.

### Out of scope

- The `sessions_remaining` column on the `clients` table is still written independently by some routes (e.g., `renew-package/route.ts:113-114`). This is a stored denormalisation, not a derive path. It is out of scope for this unit.
