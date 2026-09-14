# Lane Notes — lane-u8-tasks-default-all

## What changed

**CR-EF-177: Tasks board defaults to all tasks; My Tasks toggle remembered**

File: `app/hub/(protected)/tasks/TasksManager.tsx`

- Added `useEffect` import
- Changed `showOnlyMine` initial state from `() => !!currentUserName && ASSIGNEE_OPTIONS.includes(currentUserName)` to reading `localStorage` key `ef.tasks.myTasksOnly` (defaults to `false` if absent or on SSR)
- Added `useEffect` to persist `showOnlyMine` to `localStorage` on every change

No filtering logic was changed — only the default and persistence layer.

## Verify output

- `tsc --noEmit`: passed (zero errors)
- `eslint TasksManager.tsx`: passed (zero errors, zero warnings)

## Out of scope

Nothing notable. The filtering logic at line 396+ correctly reads `showOnlyMine` already; the only change needed was the default value and persistence.
