# Lane notes — ef067-u6-finance-overview-spec

## What the spec says

CR-EF-141's spec (design-systems v3/13-finance.html, Craig cleared 2026-09-21) is the source
of truth, not the earlier visual mockup. The key decisions in the mockup's Q1–Q3 comments:

- **Q1** — Five decision types drive the queue: block ending, draft invoice, overdue unmatched,
  bank matches, missing rate. Every row traces to a real column.
- **Q2** — All four KPI tiles CUT (Outstanding, Overdue, Paid, Pending reconciliation). Tax
  and Forecast cards CUT from dashboard. These tools exist but are not decisions for today.
- **Q3** — "Unpaid" is not a state this hub can honestly compute. Three strengths of claim:
  bank match (strong), Esther's status (neutral), overdue with no match (gap to close).

## What was wrong on main

The stale branch `lane/ef-s1-baseslim-blocklang` had already merged most of the spec work,
but the page still had deviations from the spec:

1. **Title said "Cashflow"** — spec says "Finance"
2. **4-tile KPI band present** — spec Q2 cuts all four
3. **ForecastSection and TaxSection inlined** — spec Q2 cuts them from dashboard
4. **"Elsewhere" section had 1 link** — spec has 4: Reconciliation, Bank transactions, Tax, Forecast

## What I changed

Single file: `app/hub/(protected)/cashflow/page.tsx`

- Title: "Cashflow" → "Finance" (25px, matching spec .qhdr-t)
- Removed KPI band (4 × KpiTile)
- Removed ForecastSection and TaxSection inline cards
- Removed clients query (getMoneySummary handles queue logic server-side)
- Removed unused imports: KpiTile, icons, computeForecast, currentTaxYear, getTaxYearBounds,
  ForecastSection, TaxSection
- Restored "Elsewhere" section with 4 links matching spec mockup lines 507–513

## What I left alone

- `ForecastSection.tsx` and `TaxSection.tsx` — still used by their own standalone routes
  (`/hub/cashflow/forecast`, `/hub/cashflow/tax`), still reachable from Elsewhere
- `getMoneySummary` helper — builds the queue correctly (all 5 decision types), also returns
  KPIs that this page no longer displays; the helper is shared with the PWA money page
- The stale branch's "program" vocabulary in money-summary.ts headline — shared helper, not
  scoped to this lane

## tsc

Clean — 0 errors.
