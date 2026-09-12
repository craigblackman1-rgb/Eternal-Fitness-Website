# LANE-REPORT-bug192

## BUG-EF-192 — PWA blank screen resilience

**Branch:** `lane/ef-bug192-pwa-resilience`
**Commits:** 6 (one per section + lane report)
**Status:** Done

---

## Files touched

| File | Change |
|---|---|
| `app/hub/sw.js/route.ts` | **New.** Route handler serves hub SW with per-deploy `CACHE_NAME` (VERSION from `SOURCE_COMMIT` or `Date.now()`) |
| `app/portal/sw.js/route.ts` | **New.** Route handler serves portal SW with per-deploy `CACHE_NAME` |
| `public/hub/sw.js` | **Deleted.** Replaced by route handler |
| `public/portal/sw.js` | **Deleted.** Replaced by route handler |
| `scripts/stamp-sw.cjs` | **Deleted.** Build-time stamp replaced by per-boot route version |
| `package.json` | `build` script restored to `next build` (was `node scripts/stamp-sw.cjs`) |
| `components/hub/ServiceWorkerRegistration.tsx` | Detects SW update → reloads once (module-level guard); catches chunk load errors → reloads once per 30s (sessionStorage) |
| `components/portal/service-worker-registration.tsx` | Same as hub twin |
| `components/hub/MobileErrorPanel.tsx` | **New.** Shared error boundary UI: mobile-style full-height panel with error message, Reload button, Back link |
| `app/hub/m/error.tsx` | **New.** Error boundary for `/hub/m/*` routes, links back to Today |
| `app/hub/m/train/[sessionId]/error.tsx` | **New.** Error boundary for train screen, links back to Training |
| `app/hub/m/train/[sessionId]/TrainScreen.tsx` | Line 1273: `{` · ${phase}`}` → `{phase ? ` · ${phase}` : ""}`; `phase` prop type → `string | null` |

## SW versioning approach (revised)

The original build-time stamp approach failed in production because:
1. `Dockerfile` copies `public/` straight from the builder — `stamp-sw.cjs` restores originals after `next build`, so the deployed SW had the literal `__SW_VERSION__` placeholder
2. `.dockerignore` excludes `.git` and the production Docker image has no `git`, so `execSync("git rev-parse")` throws and the build fails

**New approach:** Each SW is served from a Next.js route handler (`app/hub/sw.js/route.ts`, `app/portal/sw.js/route.ts`). The `CACHE_NAME` is interpolated at module load from `process.env.SOURCE_COMMIT` (first 8 chars) or `Date.now().toString(36)` as fallback. Every container boot gets a fresh cache name, which is the entire requirement. `force-dynamic` is used since VERSION is not a compile-time constant.

**Middleware finding:** `middleware.ts` already bypasses `/hub/sw.js` and `/portal/sw.js` (lines 12-14) — the SW is served without auth redirect. No changes needed.

**Cache lifecycle:** Every deploy produces a unique cache name (e.g. `hub-shell-m1a2b3c4`). The existing `skipWaiting()` + `clients.claim()` in `install`/`activate` ensures immediate takeover. The `message` listener adds a second path for `SKIP_WAITING`. Old caches are deleted on `activate` by the `key !== CACHE_NAME` filter.

## Build/tsc output

### `npx tsc --noEmit`
```
npm warn Unknown project config "only-built-dependencies". ...
(clean — no errors)
```

### `npm run build`
```
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

Build output includes both SW routes:
```
.next/server/app/hub/sw.js
.next/server/app/portal/sw.js
```

## git status after build
```
On branch lane/ef-bug192-pwa-resilience
Your branch is ahead of 'origin/main' by 6 commits.
nothing to commit, working tree clean
```

## Commits

1. `fix(BUG-EF-192-1): SW versioning + take over immediately` — stamp script, both SW files, package.json
2. `fix(BUG-EF-192-2): reload on SW update + catch chunk load errors` — both ServiceWorkerRegistration.tsx
3. `fix(BUG-EF-192-3): error boundaries replace blank page on crash` — MobileErrorPanel.tsx, both error.tsx
4. `fix(BUG-EF-192-4): hide null phase in train header subtitle` — TrainScreen.tsx
5. `fix(BUG-EF-192-1-fixup): serve the service worker from a route handler with a per-deploy cache version (replaces build-time stamp)` — route handlers, delete stamp-sw.cjs, delete public SW files, restore package.json
6. `docs(BUG-EF-192): lane report` — this file

## What was NOT done

- No database changes
- No `.env` changes
- No dev server run
- No push to remote
