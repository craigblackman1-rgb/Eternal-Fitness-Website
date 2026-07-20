# Work Order: Eternal Fitness — Client Data Consolidation & Document-Led Client Portal — 2026-07-20

OWNER: Claude Code — **ACTIVE, signed off by Craig 2026-07-20T12:02Z.**
SCOPE: `eternal-fitness-website` (`D:\apps\eternal-fitness-website` — hub client records, document engine, PAR-Q, a new Process & Quality module, and a new client-portal auth surface); Eternal Fitness production Postgres (VPS, `eternal_fitness` DB, reached via the Coolify SSH tunnel `127.0.0.1:5433` → `10.10.10.2:5432`, role `ef_app`); read-only reference to `decoded-ops-hub`'s `src/components/decoded-ops/operations/OperationsFramework.tsx` (pattern to port, not a file to edit — no write access to `decoded-ops-hub` under this Work Order). Registry: `infrastructure/.context/active-workorders.md`.

GOAL: Two phases, sequenced so Phase 1 makes the hub the actual single source of truth for every EF client before Phase 2 puts anything client-facing in front of them.

- **Phase 1** — Pull every client's record into the hub from wherever it currently lives (Trainerize, Outlook, OneDrive, paper), port Decoded Ops' Process & Quality System pattern into the EF hub and populate it with EF's own content, and write simple SOPs for Esther covering "migrate a client," "onboard a new client," and "build a plan in the hub."
- **Phase 2** — A documents-only client portal: client login, read-only view of what they've signed (T&Cs, Risk Assessment, Annual Review, PAR-Q once migrated), what's still outstanding, and a mirror of the update emails already being sent — reducing reliance on one-off emailed links. Explicitly **not** the full Trainerize-equivalent session-logging/plan-delivery build scoped in `EF_Trainerize_Accessibility_Scope_Jul2026.md` (2026-07-15) — that charter's Phase 1 (plan delivery + logging) and Phase 2 (accessibility-first UX) become **Phase 3** of this combined roadmap, pulled forward only if a real need (e.g. a VI client actually starts using the portal) makes it urgent.

MUST:
- Prod DB writes (any client record insert/update, any PAR-Q/document import) need Craig's **explicit per-session go-ahead** — established pattern from the PAR-Q work (`.context/decisions.log`, 2026-07-10), not just Work Order continuation.
- No data loss on the PAR-Q → document-engine migration — every existing `signed_parq` row must have a verified equivalent `client_documents` row before any legacy table is touched, per `charter-document-engine.md` Phase 4.
- Client documents/portal work builds on the existing `document_templates` + `client_documents` engine (snapshot-on-send, versioned, dual-signable) — no new one-off tables for a document type the engine already models.
- Process & Quality System: port `OperationsFramework.tsx`'s three-tab pattern (Process Register / SOPs / Improvement Log), but **write EF's own content** — do not copy TackleBag's or Decoded Ops' process entries. Esther/Craig supply the actual processes.
- Hard rules from the project `CLAUDE.md` apply throughout: no invented client stories, no fitness-marketing language on clinical content, verify studio equipment before any plan-related SOP references it, clinical populations get clinical framing.
- Any client-facing communication (portal invite, "your documents are ready" email, etc.) is generated → reviewed by Esther → sent, never auto-sent — matches the existing update-email decision (`state.md`/`decisions.log`).
- Accessibility baseline (WCAG 2.2 AA — keyboard operability, contrast, touch targets, no colour-only signalling) applies to the Phase 2 portal from the first screen, even though the deeper VI-specific work (voice logging, SR-tested plan read-order) stays in Phase 3 — see `EF_Trainerize_Accessibility_Scope_Jul2026.md` §3.1 for the exact baseline checklist.
- Log Trainerize export method used (manual CSV, screen-scrape, whatever's actually available) — there is no existing Trainerize *client*-data import (only an exercise-library scrape exists today), so this is new integration work, not a reuse of existing scripts.

DECIDE YOURSELF: exact structure/wording of the SOPs (as long as they follow the Process & Quality System's existing trigger/owner/steps/"what good looks like" shape); which client goes first in the Trainerize/Outlook/paper consolidation; whether to batch-import via a script (`scripts/`, matching the `import-parq.mjs` / `create-update-draft.mjs` pattern) or hand-enter for low-volume sources; Process Register content structure/categories; portal UI layout within the existing hub design system; which document types are already engine-native (T&Cs, Risk Assessment, Annual Review) vs still need the PAR-Q migration before they can appear on the portal.

ASK FIRST (`[GATE]`):
- Craig's sign-off to start this Work Order at all (per his instruction — this file is a draft for review in a later session).
- Any write to Eternal Fitness production Postgres — client record inserts/updates, PAR-Q migration writes, document-engine writes.
- Adding client authentication/login as a new surface (new attack surface + first time clients get any account).
- Sending anything to a real client (portal invite, document reminder, etc.) — draft and stage only.
- Deprecating/retiring the legacy `signed_parq` table or the bespoke `/agreement` form once the engine migration is proven — explicit go-ahead per `charter-document-engine.md`'s own Phase 4 note.
- Any decision on pulling Phase 3 (session logging / plan delivery / deep accessibility) forward — that's a scope-expansion call, not an execution detail.

## DONE (ticks to zero = stop)
- [ ] Every client record consolidated into the hub `clients` table with a documented source (Trainerize / Outlook / OneDrive / paper) and no duplicate/orphaned entries
- [x] Trainerize client-data extraction method chosen and documented — Craig decided manual entry 2026-07-20, no script needed
- [ ] Process & Quality System (Process Register / SOPs / Improvement Log) ported into the EF hub and populated with EF-specific content, not placeholder/copied content — module + migration live, **content not yet written**
- [ ] Three SOPs written and reviewed by Esther: "migrate a client into the hub," "onboard a new client," "build a plan using the hub"
- [ ] PAR-Q fully migrated onto the `document_templates`/`client_documents` engine with 1:1 verified parity against existing `signed_parq` rows (`charter-document-engine.md` Phase 4) — script written, **not run, not verified against live records**
- [ ] Client login/auth surface built, scoped to each client's own data only — code built (magic-link, `/portal/*`), **not deployed live, no real account created**
- [ ] Read-only client portal live: shows signed documents, outstanding/unsigned documents, and a history of update emails sent to that client — view built, **not deployed live**
- [ ] Portal passes a WCAG 2.2 AA baseline check (keyboard nav, contrast, touch targets, no colour-only states) before any client is invited
- [ ] First real client invited to the portal and confirmed it works end-to-end (sign-in → see their own documents only)
- [x] **New (2026-07-20, Craig-directed): the client document engine (consent/terms/risk-assessment/annual-review) visually matches the new brand design system** — masthead, eyebrow, serif title, meta strip, accessibility toolbar, sign-boxes, footer; deployed and verified live
- [ ] Document email sending (primary = email to client, fallback = copy link, resend once sent) — in progress

## LANES (dependency graph)
- **Lane A — Client data consolidation** (`clients` table + source docs) — no dependencies, start first.
- **Lane B — Process & Quality System + SOPs** (new hub module + `.md`/content) — independent of A, can run in parallel.
- **Lane C — PAR-Q → document engine migration** (`document_templates`, `client_documents`, retire `signed_parq` path) — independent of A/B, but blocks part of Lane D (portal can't show PAR-Q status until this lands).
- **Lane D — Client portal MVP** (auth + read-only document/update view) — depends on Lane C for full document coverage; T&Cs/Risk Assessment/Annual Review are already engine-native so a partial Lane D (those three doc types + update-email mirror) could ship before Lane C finishes if Craig wants to sequence it that way.

A and B run in parallel from the start. C runs in parallel with A/B. D starts once auth is designed but can't be considered "done" until C lands (full document coverage) — flag this dependency explicitly rather than silently shipping a portal that's missing PAR-Q status.

## UNITS

### Lane A — Client data consolidation
- [AUTO] Audit current `clients` table + all extension migrations (`20260509_training_app.sql`, `20260603_seed_clients.sql`, `20260630_client_profile_extensions.sql`, `20260704_client_master_consolidation.sql`) — produce a field-by-field map of what the hub already captures per client. VERIFY: map covers every column, flags any that are unused/dead.
- [AUTO] Determine the actual Trainerize export path available (CSV export, admin panel screen-scrape, or manual read-and-type) — there is no existing client-data script, only the exercise-library scraper (`scripts/scrape-trainerize-exercises.mjs`) which is a different data type. VERIFY: method documented with a worked example on one real client.
- [AUTO] ~~Build (or extend `import-parq.mjs`'s pattern into) a reusable client-import script if volume justifies it; otherwise document a manual entry SOP if only a handful of clients are on Trainerize/paper.~~ **Decided 2026-07-20 by Craig: manual entry.** No import script needed — client data will be typed into the hub by hand from Trainerize/Outlook/paper sources.
- [AUTO] Draft a JSON/CSV staging file per client from Outlook/OneDrive/paper sources, cross-checked against the field map for completeness. VERIFY: every listed client has a staging file, no client silently dropped.
- [GATE] Writing any staged client record to production Postgres.

### Lane B — Process & Quality System + SOPs
- [AUTO] Read `D:\apps\decoded-ops-hub\src\components\decoded-ops\operations\OperationsFramework.tsx` in full to confirm the exact tab structure (Process Register / SOPs / Improvement Log) and data shape (`ProcessEntry[]`, `SOP[]`, `ImprovementEntry[]`) before porting. VERIFY: structure matches what's described here — flag any drift.
- [AUTO] Port the component shell into the EF hub (new route, matching hub design system, not Decoded Ops' branding) with empty/placeholder arrays — no content yet. VERIFY: renders correctly inside the hub's existing nav/layout.
- [AUTO] Draft EF's actual Process Register entries (what processes exist today: client migration, onboarding, plan-building, PAR-Q handling, update-email sending) with owner/trigger/steps for each, in the same shape as the TSX arrays. VERIFY: every entry reviewed for accuracy against how the hub actually works today, not aspirational.
- [AUTO] Write the three required SOPs ("migrate a client," "onboard a new client," "build a plan in the hub") in the SOP shape (trigger/owner/steps/"what good looks like"). VERIFY: each SOP is followable by someone who hasn't done the task before — Esther is the real test reader.
- [AUTO] Decided 2026-07-20: DB-backed editor, not hardcoded — Esther needs to edit SOPs/process entries herself without a code change each time. Design a minimal schema (`process_entries`, `sops`, `improvement_log` tables or equivalent) and a simple hub-admin CRUD UI reusing existing hub form patterns. VERIFY: schema supports the same shape as `OperationsFramework.tsx`'s arrays; a non-technical edit (add/update one entry) requires no code deploy.

### Lane C — PAR-Q → document engine migration
- [AUTO] Read `charter-document-engine.md` Phase 4 note in full and confirm current state of `signed_parq` vs `document_templates`/`client_documents` before starting. VERIFY: no assumptions carried over from the July 4 charter without re-checking against the live schema.
- [AUTO] Build a `document_templates` entry for PAR-Q (structured `body` JSON, matching the 29-question structure already used) and a migration script to snapshot each existing `signed_parq` row into `client_documents`. VERIFY: 1:1 field mapping documented, spot-checked against at least 3 real client records.
- [AUTO] Fix the known Colin-flow caveat (anon read of `/parq/edit/[id]` fails under authenticated-only RLS) as part of moving PAR-Q onto the engine's service-role public-access pattern. VERIFY: a logged-out client can load their own PAR-Q resume link post-migration.
- [GATE] Running the migration against production Postgres.
- [GATE] Retiring/deprecating the legacy `signed_parq` table or bespoke `/agreement` form once parity is proven.

### Lane D — Client portal MVP
- [AUTO] Design client auth (magic-link or password, scoped to own data only) — no implementation yet, just the approach + a WCAG 2.2 AA check on the login flow itself (no CAPTCHA, no puzzle 2FA per the existing accessibility charter §3.1). VERIFY: approach reviewed against baseline accessibility checklist before build starts. **Decided 2026-07-20 by Craig: magic-link, approved as designed in `.context/lane-d1-client-auth-design.md`.** Cleared to start the unit below.
- [AUTO] Build the read-only portal view: signed documents, outstanding/unsigned documents, update-email history — reusing existing hub components/data where possible rather than a parallel UI system. VERIFY: a client can only ever see their own records (tested with two different client accounts). **Built 2026-07-20** (`78a650b`) — magic-link auth + `/portal/*` view. Not yet run/deployed live, not yet tested with real accounts.
- [AUTO] Run the WCAG 2.2 AA baseline pass (keyboard-only walkthrough, contrast check, touch target sizing, no colour-only status indicators) on every portal screen before any client sees it. VERIFY: documented pass/fail per screen, not a single overall claim. **Doc produced** (`.context/lane-d2-wcag-check.md`) but this was a self-check during the build, not an independent walkthrough — worth a real pass before inviting anyone.
- [GATE] Implementing client login as a live auth surface on production.
- [GATE] Inviting any real client to use the portal.

### Lane E — Design system rollout + document delivery (added 2026-07-20, Craig-directed, not in the original scope)
- [AUTO] Port the brand-staging design system (`D:\apps\design-systems\brand-staging-2662e9`) into the client document engine (all 4 kinds: terms/risk_assessment/annual_review/consent) — masthead, eyebrow, serif title, meta strip, functional accessibility toolbar (text size + high contrast), numbered sections, sign-boxes, footer. **Done** (`0767276`), deployed and verified live on staging.
- [AUTO] Build the `consent` document type end-to-end (schema, interactive checkbox capture, sign flow, API persistence) using the accessible reader-controls variant from the reference (not the card/progress-bar alt). **Done** (`8b3b689`), migrations run against prod, template live, verified via a real staging document.
- [AUTO] Align hub client detail + edit pages to the reference mockups (tabs, meta chips, segmented controls, field contrast, sticky save bar) — scoped narrowly after confirming the sidebar and client list table already matched. **Done** (`0601531` + `c4586a4` safety fix for a shared-component blast-radius issue caught before push), deployed and verified live.
- [AUTO] Fix the document-page focus ring to match the hub's existing focus convention (was a 6px full-strength rose glow vs. the hub's 3px/30%-opacity rose ring). **Done** (`2fb225e`), deployed and verified live.
- [AUTO] Document email sending — primary method = email the client the sign link (reusing the existing branded email layer), copy-link kept as manual fallback, "Resend email" once already sent. **In progress** — first attempt stalled with no output and was restarted.
- [ ] Broader hub design sweep beyond client list/detail/edit — explicitly deferred; Craig scoped this down to client pages only when asked.

## LEDGER
Progress written per unit to `eternal-fitness-website/.context/handoff.md` (all lanes) and this Work Order's DONE checklist. Add a row to `infrastructure/.context/active-workorders.md` when this moves from DRAFT to ACTIVE.

## CONTEXT
- **Source docs:** `EF_Trainerize_Accessibility_Scope_Jul2026.md` (2026-07-15, OneDrive workspace repo) — the existing 4-phase accessibility/commercialisation charter; its Phase 1 (session logging/plan delivery) and Phase 2 (accessibility-first UX) are folded into **Phase 3** of this Work Order, not dropped. `charter-document-engine.md` (OneDrive workspace repo, `.context/`) — the document engine's own build charter, Phase 4 (PAR-Q migration) is Lane C here.
- **Process & Quality System reality check:** it's a hardcoded `.tsx` component with no database backing and no admin UI — found in `decoded-ops-hub` and copy-pasted into `decoded-data-app` for TackleBag. Porting it is a UI-shell copy + fresh content-writing job, not a plug-in install. Flagged as an open decision in Lane B on whether to leave it hardcoded or add a DB-backed editor.
- **Client data reality check (as of 2026-07-20):** `clients` table exists with real data; PAR-Q import is substantial and working (`scripts/import-parq.mjs`, 13+ clients ported); Trainerize integration to date is exercise-library only, no client-data import exists; document engine (`document_templates`/`client_documents`) is live and already covers T&Cs, Risk Assessment, and Annual Review.
- **Prod DB access pattern:** Coolify SSH tunnel, `127.0.0.1:5433` → `10.10.10.2:5432`, role `ef_app` — tunnel opened by Craig each session, password handled inline per script invocation, never persisted to disk. Every write needs Craig's explicit go-ahead that session, not inferred from Work Order approval alone.
- **Two VI clients exist today** but neither is expected to use the portal immediately — this is why Phase 2 stays document-only and Phase 3's deeper accessibility work (voice logging, SR-tested plan read order) is deliberately deferred rather than gold-plated up front.
