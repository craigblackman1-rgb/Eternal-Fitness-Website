# Lane Notes: ef-u10-pwa-today-parity

## Shared helpers created

| Helper | File | Desktop page calls same helper | PWA screen calls same helper |
|--------|------|-------------------------------|------------------------------|
| `getTodayAlertsAndWeekCount` | `lib/hub/alerts.ts` | `app/hub/(protected)/page.tsx` (Today) | `app/hub/m/page.tsx` (PWA Today) |
| `getMoneySummary` | `lib/hub/money-summary.ts` | `app/hub/(protected)/cashflow/page.tsx` (Cashflow) | `app/hub/m/money/page.tsx` (PWA Money) |
| `getClientNeeds` | `lib/hub/client-needs.ts` | `app/hub/(protected)/clients/[id]/page.tsx` (ClientRecordShell via buildNeedsYouItems) | `app/hub/m/clients/[id]/page.tsx` (PWA ClientModeView) |
| `buildNeedsYouItems` | `lib/hub/build-needs-you.ts` | `app/hub/(protected)/clients/[id]/NeedsYouQueue.tsx` (re-exports) | Called via getClientNeeds |

## Screen-to-helper mapping

### PWA Today (`app/hub/m/page.tsx` + `TodayScreen.tsx`)
- **Helper called:** `getTodayAlertsAndWeekCount` from `lib/hub/alerts.ts`
- **Desktop equivalent:** `app/hub/(protected)/page.tsx` calls the same helper
- **Renders:** Alerts section (collapsible, rose/amber dots, headlines, links) + week count in sessions header

### PWA Money (`app/hub/m/money/page.tsx` + `MoneyScreen.tsx`)
- **Helper called:** `getMoneySummary` from `lib/hub/money-summary.ts`
- **Desktop equivalent:** `app/hub/(protected)/cashflow/page.tsx` calls the same helper for KPIs
- **Renders:** "Needs you" action queue (draft invoices, overdue, bank matches, missing rates) above the invoice segmented list

### PWA Client (`app/hub/m/clients/[id]/page.tsx` + `ClientModeView.tsx`)
- **Helper called:** `getClientNeeds` from `lib/hub/client-needs.ts`
- **Desktop equivalent:** `app/hub/(protected)/clients/[id]/page.tsx` passes the same data to ClientRecordShell which calls `buildNeedsYouItems`
- **Renders:** "Needs you" section at top of training pane (gone-quiet, tasks, drafts, renewals, compliance, etc.)
