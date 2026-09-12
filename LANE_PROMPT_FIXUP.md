# Fixup: BUG-EF-192 section 1 — the build-time stamp cannot work in production. Replace it.

Same worktree/branch as before. **Rule 1: make each edit and commit BEFORE any further investigation.** No DB, no .env, no dev server. `npx tsc --noEmit` and `npm run build` are the only checks.

## Why your section-1 approach fails (do not re-investigate — facts)

- `Dockerfile` copies `public/` straight from the builder's disk into the runtime image (`COPY --from=builder /app/public ./public`). Your `scripts/stamp-sw.cjs` restores the ORIGINAL files after `next build`, so the deployed `public/hub/sw.js` would contain the literal `hub-shell-__SW_VERSION__` — no versioning at all.
- `.dockerignore` excludes `.git` and `node:22-alpine` has no `git`, so `execSync("git rev-parse --short HEAD")` throws on Coolify and the production build fails before `next build` even runs.

## Do this instead — serve the SW from a route handler with a per-boot version

1. `git rm scripts/stamp-sw.cjs` and restore `package.json` `"build": "next build"`.
2. Move `public/hub/sw.js` → `app/hub/sw.js/route.ts` and `public/portal/sw.js` → `app/portal/sw.js/route.ts` (folder literally named `sw.js`, same pattern as `app/robots.txt/route.ts`). `git rm` the two public files — a public file at the same path would shadow the route.
3. Each route file:
   ```ts
   import { NextResponse } from "next/server";
   export const dynamic = "force-static"; // if this errors with the version const, use "force-dynamic" instead and say so in the report
   const VERSION = (process.env.SOURCE_COMMIT ?? "").slice(0, 8) || Date.now().toString(36);
   const SW_SOURCE = String.raw`...the exact SW body you already wrote, with CACHE_NAME = "hub-shell-${VERSION}"...`;
   export function GET() {
     return new NextResponse(SW_SOURCE, {
       headers: {
         "Content-Type": "application/javascript; charset=utf-8",
         "Cache-Control": "no-cache, no-store, must-revalidate",
         "Service-Worker-Allowed": "/hub/",   // "/portal/" for the portal one
       },
     });
   }
   ```
   Interpolate VERSION into the source via a template literal (`${VERSION}`) — make sure no other `${` sequences exist in the SW body (there are none today; if you add any, escape them). `Date.now()` at module load is fine: every deploy is a fresh container, so every deploy gets a new cache name, which is the entire requirement. Coolify sets `SOURCE_COMMIT` on some builds; using it when present is a bonus, not required.
4. `src/middleware.ts` / `middleware.ts` at repo root: check its matcher — `/hub/sw.js` must NOT be redirected to `/hub/login` for an unauthenticated request (the SW is fetched by the browser without a page context on update checks). Look at how `/hub/login`, `/hub.webmanifest`, or `/api/` are excluded and add `/hub/sw.js` and `/portal/sw.js` the same way if needed.
5. Keep sections 2, 3 and 4 exactly as committed. `ServiceWorkerRegistration.tsx` still registers `/hub/sw.js` with scope `/hub/` — unchanged.
6. Verify in the build output that `/hub/sw.js` and `/portal/sw.js` appear as routes.

## Done means

- `npx tsc --noEmit` clean, `npm run build` clean, `git status` clean apart from your commits.
- One commit: `fix(BUG-EF-192-1): serve the service worker from a route handler with a per-deploy cache version (replaces build-time stamp)`.
- Update `LANE-REPORT-bug192.md`: replace the section-1 description with the new approach, include the middleware finding, the build route listing lines for `/hub/sw.js` and `/portal/sw.js`, and tsc/build tails. Commit it.
