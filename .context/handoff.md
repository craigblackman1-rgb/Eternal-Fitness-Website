# Handoff

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
