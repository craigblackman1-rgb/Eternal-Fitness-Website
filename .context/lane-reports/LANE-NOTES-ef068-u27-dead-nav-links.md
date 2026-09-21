# Lane Notes: ef068-u27-dead-nav-links

## What was done

Removed two dead child nav entries from the hub sidebar (`HubSidebar.tsx`) and their breadcrumb references (`HubBreadcrumb.tsx`):

1. **Agreements** (child of Documents) — pointed to `/hub/agreements`, which redirects to `/hub/documents` per `next.config.js:185` (CR-EF-141 agreements retired).
2. **Forecast** (child of Finance) — pointed to `/hub/cashflow/forecast`, which redirects to `/hub/cashflow` per `next.config.js:177` (CR-EF-141 forecast merged into parent).

## Files changed

- `app/hub/(protected)/HubSidebar.tsx` — removed Agreements child from Documents nav group, removed Forecast child from Finance nav group.
- `app/hub/(protected)/HubBreadcrumb.tsx` — removed `/hub/agreements` from crumbLabels, removed `/hub/cashflow/forecast` from crumbLabels and sectionRoutes, removed agreements route handler from resolveCrumb.

## Verification

- `tsc --noEmit` — clean, 0 errors.
- Both removed routes are confirmed dead: `/hub/agreements` and `/hub/cashflow/forecast` are 302-redirected in `next.config.js`.

## Scope

Only touched nav link markup/config as requested. Did not touch the actual page components (agreements/, cashflow/forecast/) or any other routes.
