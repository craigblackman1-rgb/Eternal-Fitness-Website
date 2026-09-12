# LANE-REPORT-bug192

## BUG-EF-192 — PWA blank screen resilience

**Branch:** `lane/ef-bug192-pwa-resilience`
**Commits:** 5 (one per section + lane report)
**Status:** Done

---

## Files touched

| File | Change |
|---|---|
| `public/hub/sw.js` | `CACHE_NAME` → `__SW_VERSION__` placeholder; added `message` listener for `SKIP_WAITING`; static-asset fetch errors now propagate |
| `public/portal/sw.js` | Same changes as hub SW |
| `scripts/stamp-sw.cjs` | **New.** Replaces `__SW_VERSION__` with git short hash, runs `next build`, restores originals in `finally` block |
| `package.json` | `build` script changed from bare `next build` to `node scripts/stamp-sw.cjs` |
| `components/hub/ServiceWorkerRegistration.tsx` | Detects SW update → reloads once (module-level guard); catches chunk load errors → reloads once per 30s (sessionStorage) |
| `components/portal/service-worker-registration.tsx` | Same as hub twin |
| `components/hub/MobileErrorPanel.tsx` | **New.** Shared error boundary UI: mobile-style full-height panel with error message, Reload button, Back link |
| `app/hub/m/error.tsx` | **New.** Error boundary for `/hub/m/*` routes, links back to Today |
| `app/hub/m/train/[sessionId]/error.tsx` | **New.** Error boundary for train screen, links back to Training |
| `app/hub/m/train/[sessionId]/TrainScreen.tsx` | Line 1273: `{` · ${phase}`}` → `{phase ? ` · ${phase}` : ""}`; `phase` prop type → `string | null` |

## SW versioning approach

Source files (`public/hub/sw.js`, `public/portal/sw.js`) contain the literal string `__SW_VERSION__` in `CACHE_NAME`. At build time, `scripts/stamp-sw.cjs` replaces this with `git rev-parse --short HEAD`, runs `next build` (which copies the stamped files from `public/` into the standalone output), then restores the originals in a `finally` block.

**Repo stays clean:** source files always contain `__SW_VERSION__`. The stamped hash only exists in the build output. The `finally` block guarantees restore even if the build fails.

**Cache lifecycle:** Every deploy produces a unique cache name (e.g. `hub-shell-9435258`). The existing `skipWaiting()` + `clients.claim()` in `install`/`activate` already ensured immediate takeover. The new `message` listener adds a second path for `SKIP_WAITING`. Old caches are deleted on `activate` by the existing `key !== CACHE_NAME` filter.

## Build/tsc output

### `npx tsc --noEmit`
```
npm warn Unknown project config "only-built-dependencies". ...
(clean — no errors)
```

### `npm run build`
```
[stamp-sw] public\hub\sw.js → 9435258
[stamp-sw] public\portal\sw.js → 9435258
✓ Compiled successfully
  Skipping linting
  Checking validity of types ...
  Generating static pages (150/150)
✓ Generating static pages (150/150)

⚠ EPERM on standalone file-tracing (pre-existing Windows/pnpm symlink issue —
  per CLAUDE.md: "pnpm build may fail at the standalone file-tracing step on
  Windows with EPERM on symlinks — a pre-existing Windows/pnpm quirk, not a
  code issue; Coolify's Linux Docker build is fine")
```

## git status after build
```
On branch lane/ef-bug192-pwa-resilience
Your branch is ahead of 'origin/main' by 5 commits.
Changes not staged for commit:
  modified:   LANE_PROMPT.md   (task prompt, not code)
  modified:   LANE_PROMPT_FIXUP.md   (task prompt, not code)
```

## Commits

1. `fix(BUG-EF-192-1): SW versioning + take over immediately` — stamp script, both SW files, package.json
2. `fix(BUG-EF-192-2): reload on SW update + catch chunk load errors` — both ServiceWorkerRegistration.tsx
3. `fix(BUG-EF-192-3): error boundaries replace blank page on crash` — MobileErrorPanel.tsx, both error.tsx
4. `fix(BUG-EF-192-4): hide null phase in train header subtitle` — TrainScreen.tsx
5. `docs(BUG-EF-192): lane report` — this file

## What was NOT done

- No database changes
- No `.env` changes
- No dev server run
- No push to remote
