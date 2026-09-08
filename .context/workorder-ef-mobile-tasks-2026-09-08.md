> **FROZEN 2026-09-08 -- absorbed into wo-ef-consolidated-2026-09-08.**
> This work order was closed by wo-registry-consolidation-2026-09-08. Open units and warnings were
> migrated to: `infrastructure/.context/workorder-ef-consolidated-2026-09-08.md`. Do not add work here.

# Work Order — Mobile hub Tasks screen (CR-EF-178)

**OWNER:** claude/tasks-link-side-nav-c51d6e session, 2026-09-08
**SCOPE:** eternal-fitness-website only. Files: `app/hub/m/tasks/**`, `components/hub/MobileShell.tsx`,
`app/hub/m/mobile.css`, plus the mockup under `D:\apps\design-systems\ef-control-hub\mobile\tasks\`.
FORBIDDEN: the desktop board (`app/hub/(protected)/tasks/**`), `/api/tasks` route behaviour, any DB migration.

## Problem

`MobileRedirect` bounces every hub route to `/hub/m` under 768px. `app/hub/m/` has
today / availability / book / calendar / clients / train — **no tasks screen**. Esther working
from her phone cannot reach the task board at all. The mobile Today screen shows only her own
tasks due today-or-overdue (`TodayScreen.tsx:206`), so anything dated further out is invisible.
Verified against prod 2026-09-08: Anne Wareing's `Update` (due 2026-10-10) cannot be seen on mobile.

## DONE

- [ ] `/hub/m/tasks` renders on a phone, reachable from the mobile shell without typing a URL.
- [ ] Lists every task the desktop board would show for the signed-in user, not just due-today.
- [ ] Filter by status (To Do / In Progress / Done) and by client; status can be advanced in place.
- [ ] Create a task from mobile, with client + assignee + due date + bucket.
- [ ] Matches the approved mockup section-by-section (Design Parity Gate).
- [ ] Verified by Claude in a real mobile viewport against prod-shaped data — not a lane self-report.

## LANES

### L1 — Design (blocks L2)
- [GATE] u1 — OpenDesign run: `mobile/tasks/hub-m-tasks.html` in `ef-control-hub`, plus a tabbar
  variant showing how Tasks is reached. Two options to resolve in the mockup:
  **(a)** 5th tab in the bottom bar, **(b)** keep 4 tabs, enter from the Today screen's task section.
  VERIFY: mockup files exist; Craig approves one option.

### L2 — Build (after u1 approved)
- [AUTO] u2 — `app/hub/m/tasks/page.tsx` + client component, server-side session check same as
  `app/hub/m/layout.tsx`. VERIFY: route renders at 375px, no console errors.
- [AUTO] u3 — Shell entry point per the approved option (`MobileShell.tsx` and/or Today section link).
  VERIFY: reachable from `/hub/m` in two taps.
- [AUTO] u4 — Status toggle + create form, reusing `/api/tasks` and `/api/task-buckets` as the
  desktop board does. VERIFY: create + status change round-trip against the DB.
- [AUTO] u5 — Design Parity pass against the approved mockup. VERIFY: section-by-section diff.

## LEDGER

- 2026-09-08 — WO raised off CR-EF-178. CR-EF-176 (desktop sidebar Tasks link) already shipped to
  main as dd29f68; that fixes the desktop half only.
