> **FROZEN 2026-09-08 -- absorbed into wo-ef-consolidated-2026-09-08.**
> This work order was closed by wo-registry-consolidation-2026-09-08. Open units and warnings were
> migrated to: `infrastructure/.context/workorder-ef-consolidated-2026-09-08.md`. Do not add work here.

# Work Order — Unified client training model (staging build)

**OWNER:** eternal-fitness-review-d117d6 session, 2026-09-08
**DESIGN (approved, Craig 2026-09-08):** `D:\apps\design-systems\ef-control-hub\v3\unified\`
**TARGET: `staging` branch ONLY. Nothing to `main` without Craig.**

## The model (binding)

Four objects, one dated:
- **Pot** — invoice buys 12/24/36 sessions. No start, no end, cannot expire.
- **Queue** — ordered, UNDATED list of workouts. Advances only on a completed workout.
- **Booked in** — calendar bookings; the only dated object. Each names the queue position it will consume.
- **Library** — reusable plans, back room, copied into a queue.

Vocabulary SURVIVES: Training, Workouts, Sessions left, Queue, Booked in.
Vocabulary RETIRED: "block", per-client "programme", block date ranges, the A/B/C rotation strip.

Depth goes sideways: training lives ON the client record; drawers carry detail
(one workout, full queue, library, arrangement, invoice).

## DONE

- [ ] Client record shows Training (Sessions left + Next workout, Workout queue, Booked in, So far).
- [ ] A client with a pot but no workouts renders the honest empty state — no rotation, no dates, no placeholder rows.
- [ ] Clients list shows sessions left, red at <=2.
- [ ] Mobile PWA matches at 375px.
- [ ] No surface renders the words "block" or a per-client "programme".
- [ ] Verified by Claude on staging against the mockups.

## LANES

- [AUTO] u1 — Clients list sessions-left column, red <=2 (CR-EF-183). Reuses the CORRECTED deriveSessionPot(.., baselineUsed). Files: app/hub/(protected)/clients/**.
- [AUTO] u2 — Desktop client record Training section + empty state (mockups A and B). Files: app/hub/(protected)/clients/[id]/**.
- [AUTO] u3 — Mobile PWA client training + empty state (mockup C). Files: app/hub/m/clients/**.
- [AUTO] u4 — Vocabulary retirement sweep + rotation-strip/date removal. AFTER u2+u3.
- [GATE] u5 — Craig reviews on staging; decide drawer-vs-record placement if he wants it changed.

## RISK

Staging runs its OWN database (`eternal_fitness_staging`). The pot_baseline and
programs.source migrations were applied to PROD only — deferred `dmtseiknd9j`.
Staging may show wrong pot figures until those run there. Not a code defect.

## LEDGER
- 2026-09-08 — raised from the approved unified design. Prod already carries: pot baseline fix (BUG-EF-142), pot counter restored, phantom completions cleared, Outlook auto-create stopped (CR-EF-182).
