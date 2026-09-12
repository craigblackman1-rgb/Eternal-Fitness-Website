# Lane: BUG-EF-192 — trainer PWA goes blank; make it self-heal and never render empty

You are in worktree `D:\apps\worktrees\eternal-fitness-website\ef-bug192-pwa-resilience` on branch `lane/ef-bug192-pwa-resilience` (off origin/main 3ea2cc8). Next.js 14 app router. **Rule 1: make each edit and commit BEFORE any further investigation.** Do NOT touch any database, do NOT look for .env files, do NOT run a dev server. `npx tsc --noEmit` and `npm run build` are the only checks you run.

Context: Esther's installed PWA (`/hub/m/**`, service worker `public/hub/sw.js`, registered by `components/hub/ServiceWorkerRegistration.tsx`) showed a blank screen mid-session today after 5 production deploys yesterday. The server renders the page fine. We cannot see her phone, so ship the three things that make this class of failure impossible or at least visible.

## 1. Service worker: version per deploy + take over immediately

`public/hub/sw.js` has a hardcoded `CACHE_NAME = "hub-shell-v2"` and serves `/_next/static/*` cache-first forever. Do the same for `public/portal/sw.js` (identical structure).

- Make the cache name unique per build. Simplest robust approach: in `next.config.js` inject a build id into the SW at build time — e.g. add a tiny script `scripts/stamp-sw.cjs` run from the `build` npm script (`node scripts/stamp-sw.cjs && next build`) that rewrites `const CACHE_NAME = "hub-shell-<stamp>"` (and portal) with `Date.now()` or `git rev-parse --short HEAD`. Keep the source files with a placeholder token like `__SW_VERSION__` if you go that way, and make sure `git status` after a build does NOT show the stamped files as modified (write the stamped copy to the same path but add the token replacement at build time only, OR keep the stamped value committed — pick one and say which in the report; a build must never leave the repo dirty in a way that blocks the next lane).
- `install` already calls `skipWaiting()`, `activate` already deletes old caches and calls `clients.claim()`. Keep that. Add a `message` listener for `{type: "SKIP_WAITING"}` too.
- In the fetch handler, for `/_next/static/` keep cache-first BUT on a network failure for a chunk that is not cached, do not swallow it silently — let the fetch error propagate (a chunk load error is what the boundary in step 2 catches).

## 2. Client-side: reload once when the build changes, and never sit on a chunk-load error

In `components/hub/ServiceWorkerRegistration.tsx` (and the portal twin):
- After `register()`, listen for `registration.onupdatefound` → new worker `statechange` to `activated` (or `navigator.serviceWorker.oncontrollerchange`) and call `window.location.reload()` **once** (guard with a module-level flag so it cannot loop).
- Add a `window.addEventListener("error")` / `unhandledrejection` hook that detects Next's chunk load failures (`ChunkLoadError`, message containing `Loading chunk` or `Failed to fetch dynamically imported module`) and does a single hard reload (`window.location.reload()`), guarded by a `sessionStorage` key so it reloads at most once per 30s.

## 3. Error boundaries so a crash is a message, not a blank page

Add `app/hub/m/error.tsx` (client component, `"use client"`, props `{ error, reset }`) that renders, in the mobile style (`app/hub/m/mobile.css` classes — look at how `app/hub/m/train/[sessionId]/TrainScreen.tsx` lays out its top bar), a full-height panel: heading "Something went wrong", the `error.message` in small muted text, a primary button "Reload" (`window.location.reload()`), and a secondary link "Back to Today" (`/hub/m`). Also add `app/hub/m/train/[sessionId]/error.tsx` with the same component but the secondary link goes to `/hub/m/train`. Put the shared UI in `components/hub/MobileErrorPanel.tsx` and import it from both.

## 4. Small visible bug on the same screen (fold in)

`app/hub/m/train/[sessionId]/TrainScreen.tsx` L1273: `{` · ${phase}`}` renders a literal "null" in the header subtitle when `phase` is null (Tom's session shows "Workout A — Full Body · null · 12 Sept"). Only render the phase segment when `phase` is a non-empty string.

## Done means

- `npx tsc --noEmit` clean, `npm run build` clean (run both, paste the tail of each into the report). `git status` clean after the build apart from your commits.
- One conventional commit per numbered section (`fix(BUG-EF-192): …`), committed in this worktree. Do not push.
- Write `LANE-REPORT-bug192.md` in the worktree root: files touched, what changed, the SW versioning approach you chose, exact build/tsc output tails. Commit it.
