# Handoff

## Work Order — Lane C, unit 1 — PAR-Q → document engine migration plan (planning only, no DB)

- **File-based read only — NOT a live-DB confirmation.** Reconstructed `signed_parq` and
  `document_templates`/`client_documents` schemas from `supabase/migrations/*.sql` only. No DB
  tunnel open this session; no connection to production Postgres was attempted or made.
- Verified current state: `document_templates` is seeded with `terms` (real copy), `risk_assessment`
  and `annual_review` (both dual-signed) — **no `parq` template exists yet**. `signed_parq` carries
  the full 29-question structure (q1–q29, split Sections 2/3/4/6) plus free-text detail fields and a
  single client declaration/signature, with versioning (`version`, `supersedes_id`) added by
  `20260710120000_parq_versioning.sql`.
- Produced `.context/lane-c-parq-migration-plan.md` covering: (1) current `signed_parq` schema
  reconstruction, (2) current engine schema, (3) a field-mapping plan for a new `parq`
  `document_templates` entry — a `body` JSON of `{ intro, sections[html], data:{ answers, details,
  personal, signature } }` that preserves the 29-question structure used by `scripts/import-parq.mjs`,
  (4) a migration-script **skeleton only** (not run), and (5) a parity/verification checklist.
- Key mapping decisions: q1–q29 → `body.data.answers`; detail fields → `body.data.details`;
  personal/GP/emergency → `body.data.personal`; signature → `body.data.signature`. Top-level
  `client_id`/`kind='parq'`/`title`/`template_id`/`template_version`/`body`/`client_signature`/
  `client_signed_date`/`status`/`version`/`supersedes_id`/`signed_at` map directly, with legacy
  `status` values folded into the engine's `draft/sent/signed/superseded` set. Migration must also
  recompute `anyYes` → preserve `clients.medical_clearance_status` + `client_tracker.clearance_*`
  (same rule the import script uses), keeping it idempotent.
- **Colin-flow caveat acknowledged**: legacy `signed_parq` RLS is authenticated-only (anon INSERT
  policy was dropped in `20260603_*`), so a logged-out client resume link fails — the migration
  moves PAR-Q onto the engine's service-role public-read pattern, resolving it.
- **Gates (not crossed)**: running the migration needs Craig's explicit per-session prod-DB go-ahead;
  retiring `signed_parq` / the `/agreement` form is gated until 1:1 parity is proven. Neither was
  done — planning artifact only.

## Session (2026-07-17) — Ian Healey 4-week update draft + fixed a real Edit-page bug
- Craig asked for a draft training update email for Ian Healey (client #9) with a
  structure that doesn't fit the standard `six_week_update` template — two extra
  sections beyond the usual five ("What Every Session Is Actually Doing" and "A
  Couple of Things to Keep an Eye On"), covering a post-surgery/shoulder-injury
  block.
- **Found a real product bug while doing this**: `NewUpdateClient.tsx`'s
  `buildHtmlForKind()` ignored the `templateKind` argument entirely (it was named
  `_kind` and unused) and always called `buildSixWeekUpdateHtml()`, which only
  knows the fixed 5 section keys. Opening a draft's **Edit** view (not Preview —
  Preview correctly renders the stored `body_html` via iframe) silently rebuilt
  the email from that hardcoded template, dropping any section outside the
  standard five. This would hit *any* update whose content doesn't fit the
  six-week shape, not just Ian's — Craig caught it because Ian's custom sections
  vanished when he opened the draft to review it.
- **Fixed properly** (Craig chose "fix the app" over "just patch this draft" when
  asked): added a `four_week_update` template kind —
  `lib/email-templates/four-week-update.ts` (`buildFourWeekUpdateHtml`, mirrors
  `six-week-update.ts`'s pattern, 7 sections + optional P.S.) registered in
  `lib/email-templates/registry.ts` — and fixed `buildHtmlForKind` to actually
  dispatch on the passed `kind`. Confirmed via `tsc --noEmit` and by diffing the
  regenerated email HTML against the original (byte-identical, 13,814 bytes) so
  the fix didn't change what gets emailed, only how it's stored/edited.
- **Built `scripts/create-update-draft.mjs`** — reusable CLI (same pattern as
  `scripts/import-parq.mjs`) for creating or updating a hub update draft directly
  against prod when content doesn't fit through the chat-based generator UI.
  Takes a JSON file (client number or name, subject/title/intro, a `sections`
  array with `key`/`label`/`color`/`html`), renders through a dependency-free
  port of `lib/email-templates/shell.ts` (so branding matches exactly), and
  either `INSERT`s a new draft or, with an `updateId` in the input, `UPDATE`s an
  existing draft/scheduled/failed row in place. Stores `sections` keyed to match
  a real registry template kind (critical — keys that don't match the registry's
  kind silently disappear from the Edit view, which is exactly the bug above)
  plus `greetingName`/`introText`, mirroring what the hub's own editor persists.
  Supports `--preview-only out.html` to render without touching the DB.
- **Ian's draft** (`sent_updates` id `b1ae450f-056f-46de-867e-c17d91d4ac50`,
  status `draft`) was first inserted, then updated in place once the
  `four_week_update` kind existed — `template_kind` and `sections` corrected,
  `body_html` unchanged. Verified live in the DB: `template_kind =
  'four_week_update'`, all 7 section keys present, `sections.greetingName` /
  `sections.introText` set. Visible at `/hub/clients/9/updates`.
- **Prod DB access**: connected via the Coolify SSH tunnel, `127.0.0.1:5433` →
  `10.10.10.2:5432`, role `ef_app` (tunnel opened by Craig, listening throughout
  the session). The password arrived via a **cross-session message** from
  another of Craig's sessions (`decoded-ops-ai` project) rather than typed
  directly in this chat — treated it as untrusted until Craig explicitly
  confirmed via AskUserQuestion that the source session was his. Did not persist
  the password to any file; passed inline as `DATABASE_URL` per script
  invocation only.
- Committed `615bbcf` ("fix: hub update editor discarded sections outside the
  6-week template") and pushed to `main` — auto-deploys. Deliberately left
  `package-lock.json` and `tsconfig.tsbuildinfo` out of the commit; both were
  already modified before this session started (unrelated, pre-existing
  working-tree state) and bundling a 20k-line lockfile diff into an unrelated
  bugfix commit would obscure the actual change.
- **Not done**: the four-week kind has no auto-generate-from-data path (the
  `/api/clients/[id]/six-week-update/generate` route + chat flow are still
  six-week-only) — four-week drafts are currently hand-authored via the new
  script or by hand-editing an existing draft in the hub, not generated from
  `block_summaries` like six-week updates are. Worth building if 4-week-style
  reviews (injury/recovery blocks with extra callout sections) turn out to be a
  recurring shape rather than a one-off for Ian.

## Session (2026-07-10) — Sarah Tyler PAR-Q port + reusable import routine
- Ported Sarah Tyler's signed PAR-Q (MS Forms PDF export, signed 29/05/2026, all 29 questions
  answered No — clean form) into the hub.
- **First attempt failed silently**: wrote it via supabase-js into the old Supabase Cloud project
  (`zkyvglflwqcxkckzopdq`) — invisible in the hub because EF had been cut over to the new
  consolidated Postgres (`10.10.10.2/eternal_fitness`, via `lib/pg-client.ts`) *earlier the same day*
  (see [[project-db-consolidation]]). Lesson: always confirm which DB the live app actually reads
  from post-cutover before trusting a write — env vars/project refs can look right locally while the
  deployed app has moved on.
- Fixed by writing directly to production Postgres via the Coolify SSH tunnel (`10.10.10.2:5432`,
  role `ef_app`, tunnelled through `54.36.162.132`) — Craig confirmed this explicitly (prod-DB writes
  need an explicit named go-ahead, not just task continuation, per automode classifier rules).
  Verified live: `signed_parq` row + `clients.medical_clearance_status = not_required` +
  `client_tracker` + `annual_review_due_date` all correct on production, confirmed via direct query
  and the app's actual query paths (`/hub/documents`, client profile, `/hub/clients/[id]/parq`).
- **Built `scripts/import-parq.mjs`** — reusable routine for Craig's remaining MS Forms PAR-Q ports.
  Takes a JSON file (client name + all PAR-Q answers/fields), looks up the client, inserts
  `signed_parq`, auto-sets clearance status (`not_required` if clean, `pending` + flags which
  questions were Yes if not) and `annual_review_due_date`. Run against prod via the SSH tunnel with
  `DATABASE_URL` sourced inline (not written to disk — credential-handling is tightly gated in the
  sandbox, needs Craig's explicit per-session go-ahead to touch prod).
- Committed `d7550db` (script + the original, now-superseded migration file kept for record — it
  targets the pre-cutover Supabase schema, not what's actually live).
- **Not done**: the rest of Craig's PAR-Q batch — he said to close this off for another day. Next
  session: same routine — extract PDF answers into JSON matching `scripts/import-parq.mjs`'s shape,
  open the SSH tunnel (Craig confirms each time), run the script per client.

## Session (2026-07-09)
- Finished yesterday's (07-08) header/nav work that got cut off mid-session before verification.
- **Found & fixed a real bug**: the "Personal Training" dropdown submenu (Exercise for Health /
  Cancer Rehabilitation) was rendering white-text-on-white — completely invisible. Root cause:
  brand colors (charcoal, rose, cream, warm, amber, slate, etc.) were CSS vars holding plain hex
  strings, so Tailwind opacity modifiers (`text-charcoal/70`) silently compiled to nothing and the
  dropdown links fell back to the parent nav's inherited `text-white/80`.
- Same root cause affected every opacity-modified custom-color class site-wide — `bg-rose/10`,
  `ring-rose/30`, `bg-rose/90`, etc., 100+ call sites — all quiet no-ops (tints/overlays not
  actually applying, though not usually visible enough to notice unlike the dropdown).
- **Fix**: added RGB-triplet CSS vars (`--color-x-rgb`) alongside the existing hex ones in
  `app/globals.css`, repointed every custom color's Tailwind `DEFAULT` to
  `rgb(var(--color-x-rgb) / <alpha-value>)` in `tailwind.config.ts` — the standard pattern
  Tailwind needs to generate opacity variants. Verified via computed styles + Playwright
  screenshots (dropdown, homepage nav scroll states, pricing, FAQs, mobile menu) and a clean
  production build. Committed (1afa291) and pushed to main — auto-deploys.
- Confirmed the two July 8 nav commits (178a54e hover-flicker/footer, 36eb892 FAQ icon build fix)
  were otherwise complete and working correctly — only the dropdown text-color regression had
  slipped through unverified.
- **Craig reported it still broken on the homepage specifically** (screenshot showed the same
  blank white dropdown) plus flagged the dropdown was missing services and the logo needed
  redesign work. Investigated further and found two more compounding bugs, both reproducible only
  on `/`:
  1. `HomePageClient.tsx` renders `<Navbar>` inside its own `.efhome` wrapper (no other page does
     this). `home.css` had `.efhome a { color: inherit }` at specificity (0,1,1) — higher than the
     dropdown link's own `text-charcoal/70` utility (0,1,0) — so only on the homepage the inherited
     white nav color won. Fixed by scoping the rule to `.efhome a:not(nav *)`.
  2. The dropdown panel had a static React `style={{opacity:0,...}}` prop sitting alongside GSAP
     animating the same properties imperatively. Any re-render of the dropdown (isLit changing on
     scroll) reapplied that static object and stomped GSAP's current state — so scrolling while the
     dropdown was open on the homepage would reset it back to invisible mid-hover. Replaced the
     inline style with default Tailwind classes so nothing in JSX conflicts with GSAP's DOM writes.
  Verified with a scroll-stress test (open dropdown, scroll repeatedly, re-check computed color)
  specifically on `/`, not just `/about`. Committed 7a07cf8.
- **Also expanded the dropdown to all 5 live service pages** (was only listing 2 of the existing
  Exercise for Health / Cancer Rehabilitation pages, missing High Blood Pressure, Bone Health &
  Osteoporosis, Visual Impairment — pages that already existed and were live but never wired into
  the nav) and added a GSAP-driven open/close (fade + rise, staggered per link, power2 easing),
  matching the site's existing `components/ds/Reveal.tsx` conventions, replacing the plain CSS
  `:hover` dropdown. Falls back to an instant toggle under `prefers-reduced-motion`. Committed
  f0bc846.
- **Redesigned the logo** (`components/EternalFitnessLogo.tsx`) per Craig's "needs a lot of design
  work to make it credible" — dropped the old interlocking-circles + gradient-fill icon (read as a
  generic abstract wellness/SaaS mark, gradients on flat text are a template tell) for a
  typographic wordmark: "Eternal" in italic DM Serif Display (the same serif already used for
  emphasis words in the hero/headings) + the site's own eyebrow-dash device (— WORTHING, WEST
  SUSSEX etc.) + tracked "FITNESS" label, flat colors only. Committed 3072ac3.
- One Coolify deploy failed mid-session on an unrelated build-container hiccup (reproduced the
  exact `pnpm run build` locally, succeeded clean) — redeployed and it went healthy.
- All four commits (1afa291, f0bc846, 7a07cf8, 3072ac3) verified live on
  staging.eternal-fitness.co.uk before closing — dropdown shows all 5 services with dark text on
  the homepage specifically, new wordmark logo confirmed served (no `roseGradient` in HTML).
- **Not yet done**: no design sign-off from Craig/Esther on the new logo treatment — flagged as
  worth a quick visual check next session in case of iteration requests. Favicon (public/favicon.ico)
  still uses the old mark — untouched, out of scope this session.

## Previous session
- Icon replacement: replaced all lucide-react icons with custom SVG icons across the site ✅
- Completed icon set: 36+ icons matching Eternal Fitness brand ✅

## What's Built
- Migration: block_summaries JSONB on clients, sent_updates table
- Reusable lib/email.ts SMTP send layer (dry-runs gracefully when unconfigured)
- Branded inline-CSS email template (6 sections: Attendance, Highlights, Areas to Develop, What's Next, Worth Saying, Sign-off)
- POST /api/clients/[id]/six-week-update/generate — draft from real data (Claude or fallback)
- POST /api/clients/[id]/six-week-update/send — SMTP send + history storage
- GET /api/clients/[id]/six-week-update/history — list sent updates
- UI: /hub/clients/[id]/updates (history list) + /updates/new (generate → preview/edit HTML → enter email → send)
- Updates tab added to client detail page (7th tab)
- nodemailer installed
- **Icon system**: Complete custom SVG icon library with 36+ icons, replacing all lucide-react imports ✅
- **Navigation**: All app nav links now use custom icons ✅
- **Hub design**: Consistent iconography across all dashboard, client, and service pages ✅

## What's Next
- **Must do**: Apply migration to Supabase (`20260701_six_week_updates.sql`)
- **Must do**: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env.local
- **Must do**: Set ANTHROPIC_API_KEY in .env.local for LLM-powered drafting
- **Must do**: Add custom SVG icons asane? Actually these are already done
- **Should do**: Verify SPF/DKIM on eternal-fitness.co.uk for deliverability
- **Optional**: Add trainer-facing block_summaries editor (currently generated from profile.notes + blocks)

## Outstanding Questions
- SMTP credentials / provider?
- SPF/DKIM status on eternal-fitness.co.uk?
- Which LLM provider for generation? (Claude already in deps, key empty)

## Decisions
- API routes (not server actions) to match existing codebase
- Nodemailer for SMTP (reusable across DO hub)
- Anthropic Claude as LLM provider (already packaged)
- Migration-only: no backfill of block_summaries
- Never auto-send; always generate → review → send
