# Project: Eternal Fitness

Esther Fair's personal-training business site — a studio in Worthing, West Sussex. Public
marketing site + a staff/trainer hub (client management, training blocks, session logging,
document engine) + a client portal (documents, training plans, progress, calorie calculator).
Replaces Trainerize for session delivery, progress tracking, and home-training self-logging.

**Status: DEFERRED (2026-09-23).** Craig has parked this project — no work until he reopens it.
Docs below are still accurate as a map of what exists; don't start new work here without
checking with Craig first. Gated Work Orders WO-EF-049 / -066 / -067 / -068 / -070 have open
[GATE] units awaiting a decision — see `.context/loop-status.md` tail and `wo active` for
current state before assuming anything here is stale.

## Read first
1. `.context/state.md` — running status log (newest entries at top; some entries lag real
   commits — cross-check against `git log` before trusting a "not done yet").
2. `.context/handoff.md` — most recent session close-out.
3. `.context/loop-status.md` — dispatcher/deploy ledger, append-only, most current signal for
   "what actually ran."
4. `.context/decisions.log` — append-only decision record for this repo (append-only; do not
   delete entries). Despite what older docs said, this file lives in *this* repo, not a
   separate workspace repo.
5. `.context/change-requests.md` — **frozen read view only, 2026-08-29.** Real CR/bug/WO system
   of record is the hub DB (`wo` CLI / hub.decodedops.co.uk). Do not add rows here.

## Design system — read before building any UI
Marketing site visual language: `app/design-system.css` (`.ds-*` classes) + `app/globals.css`
(tokens: `--color-ink`, `--color-rose`, `--color-teal`, `--color-cream`, `--color-warm`,
`--color-amber`). Canonical mockup source: `D:\apps\design-systems\brand-staging-2662e9\*.html`
— reconcile new UI against those files, not against staging by eye. Shared primitives live in
`components/ds/` (PageHero, CTABand, Callout, ProcessFlow, FAQSection) — extend additively.
`components/hub/` is the hub's own component library, matched against `hub-*.html` mockups in
the same design-system folder. Hub-specific redesign mockups also exist under
`D:\apps\design-systems\ef-control-hub\` — check both locations for a given screen.

## Folder map
- `app/` — Next.js App Router. Public routes at root; `app/hub/(protected)/` (staff hub);
  `app/portal/(protected)/` (client portal); `app/api/`; `app/documents/[id]/sign/` (public
  magic-link signing, no auth, gated by unguessable UUID).
- `components/` — `ds/` (shared primitives), `hub/` (hub-specific), `documents/` (document
  engine), `icons/` (custom 90+ SVG icon system, not lucide-react), `ui/` (shadcn-ui).
- `lib/` — shared utilities, DB clients, auth, email, document engine, AI plan generation.
- `db/migrations/` — all DB schema changes (plain Postgres, not Supabase).
- `public/images/` — static image assets.
- `scripts/` — one-off migration/build/utility scripts.
- `.context/` — Work Orders, handoffs, briefs, state, lane briefs/reports. Finished lane
  scratch belongs under `.context/lanes/_archive/` or `.context/lane-reports/`, not the repo
  root — several stray root-level `LANE_PROMPT*.md`/`LANE-REPORT-*.md` files were flagged in
  the 2026-09-23 doc review for exactly this (see the review's `manifest.csv`).

## Stack & infrastructure
- **Deploy:** Coolify, auto-deploy on push to `main` via GitHub webhook — never manually
  redeploy after pushing.
- **Framework:** Next.js 14.2, React 18.3, Tailwind 3.4, shadcn-ui (Radix). Package manager is
  pnpm (`pnpm-lock.yaml`); `package.json`'s `"name": "vite_react_shadcn_ts"` is a stale scaffold
  name, ignore it. Don't run plain `npm install` — see gotcha below.
- **Database:** Self-hosted Postgres on a dedicated VPS via a hand-rolled PostgREST-compatible
  shim (`lib/pg-client.ts`, exported as `supabase` from `lib/supabase.ts`) — not the Supabase
  SDK, not an ORM. No local dev DB; `.env.local` carries an SSH-tunnelled prod connection
  string (`127.0.0.1:5433`). RLS is disabled/irrelevant — don't write `CREATE POLICY ...`.
- **Build:** `next.config.js` sets `output: "standalone"`, `images.unoptimized: true`,
  `typescript.ignoreBuildErrors: true`, `eslint.ignoreDuringBuilds: true`.

## Key commands
```
pnpm dev          # dev server, port 3001
pnpm build        # next build — may fail at the standalone file-tracing step on Windows
                  #   with EPERM on symlinks (pre-existing Windows/pnpm quirk, not a code
                  #   issue); Coolify's Linux Docker build is unaffected.
pnpm start        # production server
pnpm lint         # next lint
npx tsc --noEmit  # type-check (build skips this — ignoreBuildErrors is on)
```
**Windows worktree gotcha:** `git worktree remove` can fail with "Filename too long" if
`node_modules` was junctioned — unlink the junction first (`cmd /c rmdir` on it, not `rm -rf`),
then remove the worktree.

## Auth — two isolated systems
- **Staff/trainer hub:** Better Auth (`lib/auth.ts`), email+password at `/hub/login`, sign-up
  disabled, only Esther Fair has an account.
- **Client portal:** custom auth (`lib/portal-auth.ts`), fully separate tables/cookie/middleware
  from staff auth, `crypto.scryptSync` password hashing, accounts created only via staff
  "Invite to portal." Server-side ownership check on every portal read.

## Project-specific rules / gotchas
- **Isolated worktrees only (DO-SOP-010):** every change in its own `git worktree` off a fresh
  `origin/main`; junction `node_modules` from the shared checkout rather than reinstalling.
- **Never trust an OpenCode/agent lane's self-report** — hand-review every diff before merging.
  Repeat offenders: placeholder mockup data copied into live client copy, fabricated demo
  content, static "Connected"/status badges with no real check.
- **No condition roll-calls in general marketing copy** — Specialist Training on Home/Personal
  Training is a named exception (Craig's explicit override); flag, don't silently revert.
- Esther's "Level 4" = the CanRehab Cancer and Exercise Rehabilitation qualification, never
  "Level 4 Personal Trainer / highest in the UK" — regression if you see that phrasing again.
- Blog + Specialist Training catalogue are disabled (`permanent: false` redirects in
  `next.config.js`), not deleted — code stays, restructure deferred.
- PAR-Q/Agreement now go through the document engine (`client_documents`, 6 kinds). Legacy
  `signed_parq`/`signed_agreements` tables still exist and are still read by
  tracker/compliance-tab code. `/parq/edit/[id]` is still live and legitimately linked from the
  Agreement page — do not delete it.
- Email backend (`lib/email.ts`): Resend → SendGrid → SMTP, auto-selected; dry-runs gracefully
  if none configured. `client_documents.emailed` / `sent_updates.emailed` are the definitive
  "did a real email go out" signal, not `status`.
- Tailwind opacity modifiers (`bg-rose/10`) need an `--color-x-rgb` triplet defined — bare hex
  CSS vars silently produce no CSS with an opacity modifier.
- Print/PDF uses the browser's native print via the accessibility toolbar, not
  `@react-pdf/renderer` (present in deps but unused by the live document engine).

## Where records live
- CRs/bugs/tickets/WOs: hub DB via `wo` CLI (see `~/.claude/CLAUDE.md` for the global operating
  model — not restated here).
- `.context/change-requests.md`: frozen historical read view only.
- Design mockups: `D:\apps\design-systems\brand-staging-2662e9\` (marketing) and
  `D:\apps\design-systems\ef-control-hub\` (hub) — treat as canonical spec, screenshot-diff
  against them, not "matches what I intended to build."
