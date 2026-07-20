# Handoff

## Consent document type + document-engine token cleanup (2026-07-20)

### What was built
A brand-new `consent` document type for the document engine, matching the accessible
client-consent reader in `D:/apps/design-systems/brand-staging-2662e9/documents/client-consent.html`
(the `document-system.css` variant — **not** the `client-consent-alt.html` card-style variant; the
alt is flagged here as an alternative Craig could request instead).

### Files changed / added
- **`lib/documents/types.ts`** — added `'consent'` to `DocumentKind`; added `consent: "Consent"`
  to `DOCUMENT_KIND_LABEL`; added `consentGroups?: { id; legend; options: {key; label}[] }[]` to
  `DocumentBody`; added `consent_choices?: Record<string, boolean> | null` to `ClientDocument`.
- **`lib/documents/render.tsx`** — `DocumentBodyView` now accepts optional `consentChoices` /
  `onConsentChange` props and renders `body.consentGroups` as **real interactive React checkboxes**
  (not `dangerouslySetInnerHTML`) when both are supplied.
- **`app/documents/[id]/sign/DocumentSignClient.tsx`** — renders the consent groups (via
  `DocumentBodyView`), holds their state in `consentChoices`, and includes `consent_choices` in the
  POST body when the document has `consentGroups`. Also did the SCOPED token cleanup (see below).
- **`app/api/documents/[id]/sign/route.ts`** — accepts an optional `consent_choices` field from the
  request body and persists it on the `client_documents` row when present (client role only).
- **`supabase/migrations/20260720_consent_choices_column.sql`** (NEW, **NOT run**) — purely
  additive `ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS consent_choices jsonb;`
- **`supabase/migrations/20260720_consent_template.sql`** (NEW, **NOT run**) — seeds a
  `document_templates` row for `kind='consent'`, `requires_client_signature=true`,
  `requires_trainer_signature=false` (consent is client-only), `body.intro` + a single
  `What you need to know` section (verbatim note--plain wording) + the three `consentGroups`
  (content use / platforms / identification) with option wording copied exactly from the reference.
  Guarded with `WHERE NOT EXISTS` so it is re-runnable.

### SCOPED design-token cleanup (document engine only)
Replaced hardcoded hex / JS consts in `DocumentSignClient.tsx` and `render.tsx` with the app's OWN
existing Tailwind brand tokens — this surface now pulls from the same tokens as the rest of the app,
front-end left untouched:
- Removed `NAVY`/`ROSE`/`TEAL` JS consts. Header now `bg-charcoal` (was `NAVY #282B38`),
  `bg-rose` logo tile (was `ROSE #C1839F`), `text-rose` fitness mark.
- `text-rose` → `accent-rose` checkbox accent; `bg-teal`/`text-white` submit button (was `TEAL`).
- Page + done backgrounds `bg-warm` (was `#F5F5F5`); signed-banner `bg-warm`; dividers
  `border-border-warm` (was `#E5E5E5`). Done heading `text-charcoal`.
- `rose #C1839F`, `teal #087E8B`, `warm #F5EFEA`, `border-warm #E4DDD7` already exactly match the
  new design system's rose / teal / warm / warm-border. **No new token introduced.**
- `render.tsx` still hardcodes grey text hexes (`#525A61`, `#1E1E1E`, `#E5E5E5`, `#F5F5F5`) for the
  read-only HTML sections — left as-is; they are pre-existing and outside this unit's cleanup scope.
  Flagged for a later pass if Craig wants full token alignment there too.

### ⚠ Token discrepancy for Craig to decide (out of scope — NOT resolved here)
The new design system's `DESIGN.md` specifies `ink: #131313`, which is **darker** than this app's
existing `charcoal: #2D3436` (rgb 45 52 54). This unit deliberately used the existing `charcoal`
token (per instruction: do NOT introduce a new `ink` token, do NOT resolve the discrepancy). The
numeric difference is real: `#131313` (19 19 19) vs `#2D3436` (45 52 54). Craig should decide
separately whether the app's `charcoal` should move to the design system's `ink #131313` — that is a
sitewide token decision, not a document-engine one.

### Verified
- `npx tsc --noEmit` — **no type errors in any new/changed file.**

### GATEs NOT crossed (explicitly out of scope)
- **Neither new migration has been run.** Both `20260720_consent_choices_column.sql` and
  `20260720_consent_template.sql` are written but **NOT executed**. Running them against production
  is a separate step needing Craig's explicit go-ahead.
- No database connected to, no `pnpm/npm install`, no `git push`. Local commit only.

## Work Order — Craig's decisions + Lane B migration run (2026-07-20, ~12:40pm)

- **Trainerize:** Craig confirmed manual entry — client data will be typed into the hub by hand,
  not scraped/exported. Closes Lane A units 2/3's open decision; no import script needed. Roster
  is small enough that this is the right call, not a shortcut.
- **Lane D auth:** Craig approved the magic-link design in `.context/lane-d1-client-auth-design.md`
  as-is. Green light for Lane D unit 2 (build the portal view) to proceed — but the two remaining
  `[GATE]`s on Lane D (implementing login as a *live* surface on production, and inviting any real
  client) are unchanged and still need separate explicit go-ahead, consistent with how Lane B/C's
  DB writes were staged-then-gated.
- **Lane B migration run:** Craig gave explicit per-session authorisation to write to production
  Postgres for Lane B specifically. Ran `supabase/migrations/20260720_process_quality_system.sql`
  against prod via the standing Coolify tunnel (`127.0.0.1:5433` → `10.10.10.2:5432`, role
  `ef_app`, `DATABASE_URL` sourced from `.env.local`, never printed/persisted elsewhere). Migration
  is purely additive (`CREATE TABLE IF NOT EXISTS` × 3 + indexes, no ALTER/DROP on anything
  existing) and idempotent. **Confirmed live:** `process_entries`, `sops`, `improvement_log` all
  exist, all 0 rows (as designed — no content seeded). Runner script was a temp file inside the
  repo (for `pg` module resolution), deleted immediately after, nothing else touched. This
  authorisation was scoped to Lane B only — Lane C's PAR-Q migration script remains un-run and
  needs its own separate go-ahead per the Work Order's MUST clause.

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

## Work Order — Lane A, unit 1
- **Audit complete (read-only local research, no DB touched).** Full field-by-field map written to `.context/lane-a-client-field-map.md`.
- **`clients` table is the intended single source of truth** for per-client commercial + clinical + compliance state. Every column from `20260509` (base), `20260630` (profile extensions), and `20260704` (master consolidation) is actively read/written by the hub UI.
- **Columns sourced from *other* migrations** that the consolidation view (`client_documents_summary`) exposes: `client_number`, `display_code`, `email`, `phone`, `gp_letter_*`, `annual_review_due_date`, `clearance_from`, `specialist_name`, `block_summaries`.
- **Dead / unused `clients` columns flagged:**
  - `display_code` — view-only (computed on the fly in the UI); no TS/TSX reference.
  - `clearance_from` — backfilled from `client_tracker` but never read by the app; the read path still uses `signed_agreements.medical_clearance_from`.
  - `specialist_name` — same as above; never read anywhere.
  - **Consolidation loose-end:** `clearance_from`/`specialist_name` were moved onto `clients` but the UI read path was never repointed off `signed_agreements`.
- **Related dead surface:** `client_tracker` is historical-only (not written by app); its clearance join was dropped from the rebuilt `client_documents_summary` view.
- **Next unit (A2):** determine the actual Trainerize client-data export path — no existing client-data script exists (only `scripts/scrape-trainerize-exercises.mjs`, a different data type).

## Work Order — Lane B (2026-07-20) — Process & Quality System, DB-backed

- **Task**: Port `decoded-ops-hub`'s `OperationsFramework.tsx` three-tab pattern (Process
  Register / SOPs / Improvement Log) into the EF hub as a **DB-backed** module so Esther can
  edit entries herself with no code deploy (decided 2026-07-20, replacing the original
  hardcoded-TSX approach).
- **Read-only reference**: `D:\apps\decoded-ops-hub\src\components\decoded-ops\operations/OperationsFramework.tsx`
  (confirmed structure: `ProcessEntry[]` / `SOP[]` / `ImprovementEntry[]`, tabs Process
  Register · SOPs · Improvement Log — plus Overview and AI Systems tabs that are Decoded-Ops
  specific and were intentionally **not** ported). No edits made to the decoded-ops-hub repo.
- **Migration** (`supabase/migrations/20260720_process_quality_system.sql`): creates
  `process_entries`, `sops`, `improvement_log` matching the TSX shape, adapted to EF (single
  brand — dropped `service` line, replaced with a free `area` text field; dropped the AI
  `skills[]` array as not relevant to EF). `sops.steps` stored as `jsonb`. FK-by-reference via
  `ref` strings (no hard FK — keeps entries independently editable). Tables ship **empty**; no
  content seeded. **NOT run** — needs Craig's explicit per-session prod-DB go-ahead.
- **Types** (`types/index.ts`): added `ProcessEntry`, `Sop`, `ImprovementEntry`, `ProcessStatus`.
- **UI** (`app/hub/(protected)/process-quality/`): server page reads all three tables via the
  existing supabase server client; `ProcessQualityManager.tsx` is a client component rendering
  the three tabs with the hub's own design system (`HubCard`/`HubCardHeader`/`EmptyState`/
  `Button`/`rose`/`teal`/`amber` accents — not Decoded Ops' `.doa-*` classes). Each tab has an
  inline add/edit form (reusing `Input`/`Label`/`Textarea`) and row edit/delete, wired to new
  API routes. Renders empty states until Esther adds content. Added sidebar nav link under
  "Resources".
- **API routes**: `app/api/process-entries` (+ `[id]` PATCH/DELETE), `app/api/sops` (+
  `[id]`), `app/api/improvement-log` (+ `[id]`) — all GET/POST/PATCH/DELETE, auth-gated via
  `supabase.auth.getUser()`, mirroring the existing `/api/equipment` pattern.
- **Verified**: `npx tsc --noEmit` passes for all new files (two pre-existing errors in
  `exercise-browser.tsx` and `ClientUpdatesPanel.tsx` are unrelated). Did **not** run the
  migration, did not write to any DB, did not run `next build`, did not `git push`.
- **Remaining / not done**:
  - Migration must be run against prod Postgres (Coolify SSH tunnel) with Craig's explicit
    go-ahead before the module works — tables don't exist yet.
  - EF-specific **content** (Process Register entries, the three required SOPs — migrate a
    client / onboard a new client / build a plan in the hub, and any Improvement Log entries)
    is not written; Esther/Craig supply it via the new admin UI once tables exist.
  - Decoded-Ops' "Framework Overview" and "AI Systems" tabs were intentionally omitted (not
    EF-relevant). Could add an EF-flavoured Overview tab later if wanted.
  - No row-level locking beyond supabase auth (any hub user can edit) — fine for a 1–2 person
    studio; revisit if multi-staff access is needed.

## Work Order — Lane A, unit 2 — Trainerize client-data export plan (research, unverified)

- Created `.context/lane-a2-trainerize-export-plan.md`.
- The existing scraper (`scripts/scrape-trainerize-exercises.mjs`) uses **headless Playwright
  trainer-login** on the `eternalfitness8` tenant, reading DOM — no API/token. It handles
  *exercise* data, a different type from client records; there is no existing client-data
  export script.
- Ranked export options: **manual read-and-type** (likely default for small roster) > **native
  CSV export** (if the tenant plan exposes it) > **screen-scrape** (extend existing script) >
  **partner API** (unlikely, no API usage today).
- **Explicitly unverifiable in this environment** — no Trainerize credentials or browser session
  available, so no real client was tested. The Work Order's VERIFY criterion ("worked example on
  one real client") cannot be met here. To close: Craig opens a session with browser access +
  his Trainerize login, confirms the tenant's export capability, and runs one real client through
  the chosen method. Treat the plan doc as a feasibility hypothesis until then.
- Constraints honoured: no DB access, no installs, no push — local commit only.

## Work Order — Lane D, unit 1

- **Unit:** Lane D (Client portal MVP), unit 1 — Design client auth approach
- **Type:** DESIGN ONLY / GATE unit (no implementation, no DB, no code)
- **Date:** 2026-07-20
- **Author:** Claude Code (design pass)
- **Artifacts:**
  - `.context/lane-d1-client-auth-design.md` — recommended approach (passwordless magic-link, separate better-auth instance, per-client data scoping), conflict analysis vs existing trainer/staff auth, WCAG 2.2 AA check of the login flow, open questions for sign-off.
- **Key findings:**
  - Existing staff/trainer auth = better-auth email+password (`lib/auth.ts`), session cookie guarded by `middleware.ts` + `app/hub/(protected)/layout.tsx`. Single user table, no role/tenant concept.
  - Recommended client auth = **magic-link via a second, separate better-auth instance** writing its own cookie, on `/portal/*` routes, each account bound 1:1 to a `clients.id` and server-filtered to that client's own data. Staff auth path left untouched (additive, not modifying).
  - Login flow meets Work Order AA baseline (no CAPTCHA, no puzzle 2FA, keyboard-operable) by design.
  - `EF_Trainerize_Accessibility_Scope_Jul2026.md` **not found in repo** — AA checks derived from the Work Order's stated baseline; re-verify against the charter file if located.
- **GATE status:** This unit is a GATE per the Work Order ASK FIRST list ("Adding client authentication/login as a new surface"). Design is for review/sign-off; Lane D unit 2 (build) and the live-auth GATE require explicit approval before proceeding.
- **Next:** Craig reviews approach + open questions (§5 of design doc); on sign-off, proceed to Lane D unit 2 (build read-only portal view).

## Work Order — Lane C, unit 2

- **Task**: Build the PAR-Q `document_templates` entry and a backfill/migration script that
  snapshots every existing `signed_parq` row into `client_documents` (kind='parq'), per the
  mapping in `.context/lane-c-parq-migration-plan.md` §3.
- **Deliverables (both written, neither executed)**:
  - `supabase/migrations/20260720_seed_parq_template.sql` — inserts the `parq` template row
    (structured `body` JSON with `intro` + 8 `sections` + a nested `data` block carrying
    `answers`/`details`/`personal`/`signature`). Mirrors the style of
    `20260704_risk_and_review_templates.sql`. `WHERE NOT EXISTS` guard so it is idempotent.
  - `scripts/migrate-parq-to-engine.mjs` — matches `scripts/import-parq.mjs` style (pg `Pool`,
    DATE/TIMESTAMP type parsers, `DATABASE_URL`, tunnel-aware ssl). Snapshots every legacy row
    oldest-first, re-points `supersedes_id`, re-derives `anyYes` → `clients.medical_clearance_status`
    + `client_tracker.clearance_*` (idempotent), and runs a 1:1 count-verification query. The
    `main()` call is **commented out** so it cannot run by accident. `node --check` passes.
- **1:1 field mapping** is documented in full as a header comment block in
  `scripts/migrate-parq-to-engine.mjs` and summarised in the migration plan §3. Key points:
  top-level `client_id`/`kind='parq'`/`title=full_name+' — PAR-Q'`/`template_id`/`template_version`/
  `body`/`requires_*`/`status`(mapped)/`client_signature`/`client_name`/`client_signed_date`/
  `version`/`supersedes_id`/`signed_at`/`sent_at`; nested `body.data.personal|answers|details|
  signature`. Legacy status mapping collapses the wider `signed_parq` set into the engine's
  four values (`received`/`sent`/`needs_update`→`sent`, `expired`→`draft`).
- **Explicit outstanding verification — NOT closable this session (do not fabricate a "verified" claim)**:
  there was **no database connection** this session (per the Work Order constraint and `[GATE]`).
  The 1:1 mapping is file-based only — reconstructed from `supabase/migrations/` SQL, never
  confirmed against live client records. The plan's own checklist (spot-check ≥3 real clients:
  e.g. Sarah Tyler, Colin Farley, one with a YES answer; confirm `body.data.answers` byte-equal;
  confirm clearance state unchanged) **was not performed**. Before running:
  1. Craig opens the Coolify SSH tunnel (`127.0.0.1:5433`→`10.10.10.2:5432`, role `ef_app`).
  2. Re-verify live schema with `psql \d signed_parq` / `\d client_documents` (a migration could
     have applied to prod outside this repo).
  3. Run `20260720_seed_parq_template.sql`, then `scripts/migrate-parq-to-engine.mjs` only with
     Craig's explicit per-session go-ahead.
  4. Spot-check ≥3 real clients and the verification count before the separate gated step of
     retiring `signed_parq` + the `/agreement` form.
- **Colin-flow caveat** (legacy `signed_parq` anon-read pitfall) is NOT addressed in this unit —
  it is a separate Lane C unit that must move PAR-Q resume links onto the engine's service-role
  public route. Flagged so it is not silently assumed solved.
- **Constraints honoured**: no DB access, no installs (`pg` already a dep), no push, no migration
  or script executed. Local commit only.

## Process note (2026-07-20)
Lane A/C/D's units 2 above ran as three parallel OpenCode processes that all read-appended-wrote
this same file concurrently, causing a lost-update race — several sections were silently dropped
from disk (though preserved in each unit's own commit diff, which is how this file was
reconstructed). Fixed by merging all sections back in chronological order. **Going forward:
handoff.md appends from parallel lane units should be serialized (one writer at a time, or Claude
merges after the fact) rather than left to concurrent agents.**

## Work Order — Lane D, unit 2 (2026-07-20)

Built the client portal magic-link auth surface and the read-only portal view, per the approved
design in `.context/lane-d1-client-auth-design.md` (magic-link, separate better-auth instance,
bound 1:1 to `clients.id`, server-filtered to the client's own data, staff auth untouched).

### What was built
- **Migration (NOT run):** `supabase/migrations/20260720_portal_auth.sql` — new isolated tables
  `portal_accounts`, `portal_sessions`, `portal_magic_links` (own `portal_` prefix, own cookie,
  `client_id` 1:1 FK, `disabled_at` for staff revoke, hashed single-use tokens). NO RLS policies
  for client roles — all reads are service-role, filtered by authenticated `client_id`.
- **Separate auth module:** `lib/portal-auth.ts` — self-contained magic-link request/verify/
  session/destroy over the `portal_*` tables. Distinct cookie `better_auth_portal_session`.
  `requestPortalMagicLink` emails only when a SendGrid/SMTP backend is configured; otherwise
  returns a `devLink` for review and sends nothing (Work Order rule: no auto-emit to clients).
- **API routes:** `app/api/portal/auth/request-link/route.ts` (POST, anti-enumeration — always
  `{requested:true}`), `app/api/portal/auth/verify/route.ts` (GET verify + set cookie + redirect;
  POST logout).
- **Session helper:** `lib/portal-session.ts` — reads the isolated portal cookie only.
- **Middleware:** extended `middleware.ts` matcher to `/portal/:path*` (ADDITIVE — staff `/hub`
  guard rules unchanged; separate portal cookie check; redirects to `/portal/login`).
- **Login UI:** `app/portal/login/page.tsx` — magic-link request, WCAG 2.2 AA (skip link, focus
  ring, `type=email`+`autocomplete`, text+icon status, 44px targets, no CAPTCHA/puzzle 2FA).
- **Read-only portal:** `app/portal/layout.tsx` (slim client shell + sign-out) and
  `app/portal/page.tsx` — three sections reusing hub components (`HubCard`, `HubCardHeader`,
  `StatusBadge`, `EmptyState`): signed documents, outstanding/unsigned documents, update-email
  history. Data via `lib/portal-data.ts`, which filters **every** query by `client_id`.
- **WCAG doc:** `.context/lane-d2-wcag-check.md` — pass/fail per screen (all 3 screens PASS the
  baseline on build-time review; 8 ⚠ items are token-dependent confirm-in-browser checks).

### What's verified
- `npx tsc --noEmit` — **no type errors in any new/changed file** (pre-existing unrelated errors
  in the repo, not introduced by this unit).
- Reused existing hub data/token patterns; no new colour or contrast choices introduced.

### GATEs NOT crossed by this unit (explicitly out of scope)
- **No migration run**, no database connected to, no `pnpm/npm install`, no `git push`.
- **No real email sent / no real client account created** — magic-link emails only fire when an
  email backend is configured; otherwise the link is returned for staff review only.
- **Going live as a production auth surface** (Lane D `[GATE]`) — NOT done.
- **Inviting any real client** (Lane D `[GATE]`) — NOT done.
- Before either gate: run `20260720_portal_auth.sql` on prod (Craig's per-session go-ahead), then
  a browser/SR pass to clear the 8 ⚠ WCAG confirmations, then a two-account isolation test.

### Constraints honoured
No DB access, no installs, no push, no migration/script executed, no real email/account. Local
commit only.

---

## Document engine — real design system port

**Date:** 2026-07-20
**Scope:** `app/documents/[id]/sign/DocumentSignClient.tsx`, `lib/documents/render.tsx`,
`components/documents/DocumentView.tsx` (new), `components/documents/DocumentAccessibilityControls.tsx` (new),
`app/globals.css` (document-engine block appended), `.context/handoff.md` (this entry).

### What changed
The earlier pass only swapped a few JS colour consts — the document pages still rendered with the
old dark-charcoal `BrandHeader` block and unstyled `dangerouslySetInnerHTML` sections. This rebuild
ports the **actual visual structure** from the canonical reference
(`D:/apps/design-systems/brand-staging-2662e9/documents/client-consent.html` +
`document-system.css`) so the live documents match the new brand.

New shared component `DocumentView` renders, in order, for **every** document kind:
1. **Masthead** — light warm/white surface (NOT the old dark charcoal block; the reference
   masthead is light), with EF rose-heart logo mark + "Esther Fair — Level 4 Personal Trainer /
   Private studio, Worthing, West Sussex" org text.
2. **Eyebrow** (`Client document NN`, per-kind number) + **serif italic display title** (DM Serif
   Display via existing `--font-serif`) + **standfirst** paragraph.
3. **Meta info list** — Document / Completed by / Review / Reference (per-kind reference code).
4. **Accessibility toolbar** — Text size Normal/Larger/Largest + High-contrast toggle + Print,
   persisted to `localStorage` (`ef-doc-text`, `ef-doc-contrast`) and reflected onto `<html>`
   `data-text` / `data-contrast` attributes exactly like the reference's inline script, ported to
   a React effect (`DocumentAccessibilityControls`). These are functional client features for EF's
   visually-impaired population, not decoration.
5. **Intro + numbered sections** (eyebrow numeral + serif H2 + body), 18px minimum body text,
   generous spacing, hairline rules.
6. **Consent groups** — for `consent` docs, rendered as real interactive checkboxes styled with the
   new `.consent` card style (interactive state wired to React state, captured on submit).
7. **Sign-boxes** — name/date/signature fields + sign-box visual style (Signed / Date / Logged).
8. **Footer** — review + accessibility note.

CSS was added to `app/globals.css` as a self-contained document-engine block, bound to the repo's
**existing** brand tokens (rose `#C1839F`, teal `#087E8B`, warm `#F5EFEA`, border-warm `#E4DDD7`,
charcoal/ink, etc.) and the already-loaded `font-serif` (DM Serif Display) / `font-body` (DM Sans).
**No new hex values, no new fonts, no new dependencies.** `color-mix()` is used to derive accessible
tints from the registered tokens, matching the reference's approach. High-contrast and A4 print/PDF
rules included.

### Applies to all four document kinds
It is a single shared component (`DocumentView`) consumed only by `DocumentSignClient`. The
masthead/title/sections/footer render from `doc.body` + `doc.kind`; the eyebrow number, reference
code, and meta "Document" line are keyed off `doc.kind`. **Fixing the structure fixes terms,
risk_assessment, annual_review, and consent at once** — not just consent.

### Functionality preserved (no regressions)
- Signing flow (`/api/documents/[id]/sign` POST with name/signature/date + `consent_choices`).
- `consent_choices` capture + re-render interactively inside the body.
- Already-signed state (shows "signed by … on …" note, no form).
- `done` / already-signed confirmation screen (restyled to match).
- Validation + inline error summary.

### What was NOT touched
Template editor (`app/hub/(protected)/templates/[id]/`) — it only edits content, it does not render
the document visually, so no matching visual update was required. Marketing front-end and public
pages untouched. No migration, no DB connection, no install, no push.

### Verified
- `npx tsc --noEmit` — no type errors in any changed/new file. (Two pre-existing unrelated errors in
  `exercise-browser.tsx` and `ClientUpdatesPanel.tsx` are untouched by this work.)
- All brand tokens/fonts reused — zero new colour literals or font loads.

### Next (manual, Craig)
Browser + screen-reader pass on a real document to confirm the contrast toggle and text-size
controls behave; then local review + push.

## Hub client detail/edit pages — design audit + fixes (2026-07-20)

### What was wrong vs the reference mockups
References: `D:/apps/design-systems/brand-staging-2662e9/hub-client-detail.html` and `hub-client-edit.html`.

**Detail page (`app/hub/(protected)/clients/[id]/page.tsx`)**
- Tabs used a shadcn underline `TabsList`/`TabsTrigger` (bottom-border, no fill). Reference uses a
  **raised pill container** (`bg-hub-card`, `border-hub-border`, `rounded-xl`, `p-1`, `shadow-sm`)
  with the active tab as a rose-tint **fill** = `var(--hub-sidebar-active)` (`rgba(193,131,159,.14)`).
- Header meta chips were plain `<Badge>`s. Reference uses label+value `chip-kv` chips on
  `bg-hub-card` with a `border-[var(--hub-border)]`, `rounded-lg`, placed under the title.
- Outline "Edit" button border was the default shadcn ring colour. Reference outline buttons use
  `var(--color-muted-text)` (`#7E8088`) for a deliberate 3:1 border contrast.

**Edit page (`app/hub/(protected)/clients/[id]/edit/page.tsx`)**
- Cards used shadcn `Card`/`CardHeader` (no icon, no bottom divider, different radius). Reference
  uses `HubCard` + `HubCardHeader` (icon + title + subtitle, divider under header).
- Field controls that should be **segmented controls** (training_location, sessions_per_week,
  time_tier, fitness_level, pace_mode) were rendered as **dropdown `Select`s** in several places.
  Reference uses segmented controls for these discrete choices.
- Field borders used `--hub-field-border` (`#C7CCD4`), which is below 3:1 on the canvas. Reference
  deliberately uses `var(--color-muted-text)` (`#7E8088`) for input/select borders (3:1 contrast).
- Buttons used `rounded-xl`/`rounded-md`. Reference buttons are `rounded-lg` (8px).
- No sticky save bar / dirty-state. Reference shows a bottom sticky bar with "No changes yet." /
  "Unsaved changes." based on form dirty state.

### What was fixed
- Detail: tabs → raised pill container + rose-fill active; meta → label+value `chip-kv` on
  `bg-hub-card`; outline Edit button border → `var(--color-muted-text)`.
- `components/hub/HubCardHeader.tsx`: added `noDivider` prop; root now renders a
  `border-b border-[var(--hub-border)]` divider by default (matches both mockups — detail and edit
  cards both show a header divider).
- Edit: all `Card`→`HubCard`+`HubCardHeader` with icon/title/subtitle; added `SegmentedControl`
  helper and replaced the dropdown controls with segmented controls for the 5 fields; form inputs /
  textareas / `SelectTrigger`s / `TagMultiSelect` trigger / `InjuryHistoryTable` + `TrainingRulesEditor`
  inputs all use `border-[var(--color-muted-text)] focus(-visible):border-rose focus(-visible):ring-rose/30`;
  checkboxes use `border-[var(--color-muted-text)] accent-rose`; Cancel/Save buttons `rounded-lg` with
  muted outline border; sticky save bar wired to a `dirty`/`markDirty` state ("No changes yet." /
  "Unsaved changes."), reset on load and on save.

### What was already correct (no change needed)
- `HubSidebar.tsx` — confirms to the mockup sidebar.
- `clients-table.tsx` — confirms to the mockup clients list.
- `app/globals.css` token layer — values confirmed baseline-correct against the reference
  (`--hub-canvas` `#F4F5F7`, `--hub-card` `#FFFFFF`, `--hub-border` `#E6E8EC`,
  `--hub-sidebar-active` `rgba(193,131,159,.14)`, `--color-muted-text` `#7E8088`, `--hub-hover`
  `#F8F9FB`; `rounded-lg` = 8px). No token values changed.
- `HubCard` radius stays `rounded-2xl` (acceptable — the reference cards read as a larger radius).

### Verified
- `npx tsc --noEmit` — no type errors in any changed file. (Two pre-existing unrelated errors in
  `exercise-browser.tsx` and `ClientUpdatesPanel.tsx` are untouched by this work.)
- All brand tokens/facets reused — zero new colour literals or font loads.

### Not touched (per scope)
No migration, no DB connection, no install, no push. Marketing front-end, `HubSidebar.tsx`,
`clients-table.tsx`, and the document engine (`app/documents/`, `lib/documents/`,
`components/documents/`) intentionally out of scope.

### Next (manual, Craig)
Local browser pass on a real client detail + edit screen to confirm tabs, chips, segmented controls,
and the sticky save bar render as intended; then local review + push.

## Document email sending (2026-07-20)

### What was built
Client documents can now be emailed to the client with their signing link, plus a manual copy-link
fallback. Three behaviours per Craig's request:
1. PRIMARY action = email the client the sign link (first send or resend).
2. SECONDARY action = copy the sign link (always available) for manual resend via text/WhatsApp.
3. Once `status` is not `draft`, the primary button flips to "Resend email".

### Files changed / added
- **`lib/email-templates/document-ready.ts`** (NEW) — `buildDocumentReadyEmail(input)` reuses the
  existing `buildBrandedUpdateEmail` from `shell.ts` (shell.ts NOT modified). Carries a rose
  (`#C1839F`) rounded inline-styled CTA button linking to the sign URL, plus a short friendly intro
  and "what to do / why it matters" sections. Input: `clientName`, `greetingName` (first name),
   `documentTitle`, `signUrl`. The CTA is the rose `#C1839F` rounded button rendered inside the branded shell.
- **`app/api/documents/[id]/route.ts`** — PATCH now supports `action: "send_email"`. Uses
  `createAdminClient()` (same pattern as the public GET sign route) to read the document's
  `client_id`, then looks up the client's `name`/`email` from the `clients` table. Builds the email
  via `buildDocumentReadyEmail`, sends via `getEmailSender().send({ to, subject, html })`, then sets
  `status → "sent"` and `sent_at → now` (regardless of first send or resend). Returns
  `{ success: true, dryRun }` so the UI can tell Craig whether a real backend fired. If the client
   has no email on file, returns **400** with a clear message pointing Craig to add one on the client record.
- **`app/hub/(protected)/clients/[id]/documents/[docId]/page.tsx`** — now fetches the client's
  `name`/`email` (second select on `clients` via `doc.client_id`) and passes `clientEmail` to
  `DocumentDetailClient`.
- **`app/hub/(protected)/clients/[id]/documents/[docId]/DocumentDetailClient.tsx`** — the "Send to
  client" card restructured: PRIMARY button "Send email to client" / "Resend email" (disabled with an
  inline note when `clientEmail` is empty/null), SECONDARY always-available "Copy link". After send,
  the toast reports a real send vs a dry run so Craig isn't misled when a client reports nothing
  arrived.

### Design notes / constraints honoured
- No migration run — reused existing `status` / `sent_at` columns.
- No direct DB connection outside the app's normal Supabase clients.
- `shell.ts` untouched — other live emails still depend on it.
- Marketing front-end and `components/documents/` visual redesign intentionally out of scope.

### Verified
- `npx tsc --noEmit` — no new type errors in any changed file. (Two pre-existing unrelated errors in
  `exercise-browser.tsx` and `ClientUpdatesPanel.tsx` remain, untouched.)
- **No real email was sent during the build.** The live `send_email` action was NOT invoked against
  any real document; verification was type-check only.

## Session close — 2026-07-20

Full-day session on the Work Order above (`workorder-eternal-fitness-hub-consolidation-2026-07-20.md`).
Summary for whoever picks this up next — the entries above have the full detail per unit.

**Shipped and live on staging:**
- Lane B: Process & Quality System module + migration (tables live, empty — no content yet).
- Lane D: magic-link auth + read-only portal view — code built, **not deployed as a live auth
  surface**, no real account exists.
- Lane E (added mid-session, Craig-directed, not in original scope): full brand design-system port
  into the document engine (all 4 document kinds), new `consent` document type with real interactive
  checkbox capture, hub client detail/edit pages aligned to the reference mockups, a focus-ring fix,
  and document email-sending (primary = email, fallback = copy link, resend once sent).
- Two prod DB writes made with Craig's explicit per-session go-ahead, both additive-only, verified
  live: Lane B's three tables, and the `consent` template + `client_documents.consent_choices` column.

**Not started / still open:**
- Lane A: no client data has actually been consolidated into the hub yet (method decided — manual
  entry — but no records typed in).
- Lane B: Process Register entries + the 3 required SOPs — needs real input from Craig/Esther, not
  something to write blind.
- Lane C: PAR-Q migration script exists but has not been run against prod, and its 1:1 parity has not
  been spot-checked against real client records (needs a DB tunnel session).
- Lane D: independent WCAG walkthrough (the existing doc was a self-check during the build), then two
  `[GATE]`s — deploy the auth surface live, invite a first real client.
- Broader hub design sweep beyond client list/detail/edit — explicitly deferred when scoped down.

**Two real bugs caught and fixed before shipping** (worth knowing about even though they're already
fixed): a shared-component default change would have silently altered 18+ untouched hub pages
(`HubCardHeader` divider — flipped to opt-in); the new consent-document email built a `signUrl`
variable but never put it in the HTML, so the button the email text promised didn't exist.

**Process lesson**: parallel OpenCode instances writing to the same shared file
(`.context/handoff.md`) caused a lost-update race earlier in the session — recovered from each unit's
commit diff, then avoided by not letting concurrent units free-append to a shared file. OpenCode's own
"done" self-report was not fully reliable — real verification (git history, `tsc`, and for
design/UX asks, the live site via browser automation) caught issues the self-report missed every time
it was actually checked.

**Registry**: `infrastructure/.context/active-workorders.md` reflects current status. Work Order
itself has an updated DONE checklist and a new Lane E documenting today's Craig-directed work.

## Client detail page — full redesign rollout + tab restyle (2026-07-20, later session)

Craig reported UI issues on the client detail page (greyed-out email button, a stray chevron,
misaligned Snapshot card, and — key discovery — a full mockup he'd forgotten was in the design
folder). Investigation + implementation ran in two passes.

### What was found
- **Email button "grey"**: not a bug — `DocumentDetailClient.tsx` disables the send button when
  `clients.email` is empty, with on-page text explaining it. Not resolved as a code fix; flagged
  for Craig to check the specific client's record.
- **Chevron / Snapshot alignment**: real, small issues — collapsible chevron only existed on the
  Profile tab's "Training Rules" section (`HubSection`'s `CollapsibleSection`); Overview-tab cards
  had doubled `px-5` padding (once from `HubCard`, once from an inner wrapper div).
- **The actual design gap**: `D:\apps\design-systems\brand-staging-2662e9\hub-client-detail.html`
  (found at the folder root, missed by an earlier narrower search of `documents/`/`preview/`/
  `ui_kits/`) is a complete, explicitly-1:1-modelled redesign of **all six client detail tabs** —
  Overview, Profile, Compliance, Training, Plan Agent, Updates — plus page header, severity banner,
  and tab strip. This had not been implemented; Lane E's earlier design-system pass only covered
  client list/detail/**edit** at a token level, not this full tab-by-tab layout.

### Pass 1 — full layout redesign (commit `2acaf4e`)
`app/hub/(protected)/clients/[id]/page.tsx` (+358/−291) + `components/hub/HubPageHeader.tsx`
(widened `title`/`subtitle` to `React.ReactNode`, additive, no callers broken):
- Page header: avatar-initials circle, client-number chip, `StatusBadge` inline with name, 5-chip
  key-facts row (Format/Pace/Session/Frequency/Referral) — all wired to real fields.
- Tab strip: per-tab icons + outstanding-count badges (Compliance = real outstanding count, danger
  tone on `do_not_train`; Updates = new `draftUpdatesCount` derived from `clientUpdates`).
- Profile tab: rebuilt from one long collapsible card into card-per-subject (Health spans full
  width; Baseline/Goals/Logistics/Notes/Training Rules paired) — this also resolves the chevron
  complaint, since nothing on the page is collapsible anymore.
- Training tab: block list converted from link-rows to a proper table.
- Compliance tab: added an info note on how status is derived, referencing the real
  `lib/compliance.ts`/`lib/hubStatus.ts` logic (not the mockup's fictional note).
- **Deliberately kept, not flattened**: Compliance/Training/Updates/Plan Agent kept their existing
  richer components (`DocumentRegister`, `ClinicalComplianceCard`, `GpLetterCard`,
  `ClientUpdatesPanel`, `PlanAgentTab`) rather than being replaced by the mockup's simpler static
  tables — those already do more (editable fields, per-row actions, chat UI) than the mock's
  placeholder example.
- **Honestly omitted, not fabricated**: mockup's "Photography consent" document row (no real data
  field) and its separate "Record" rail card (kept the existing Status/Active Block/Quick Actions
  rail instead, to avoid duplicating the client-number chip already in the header).
- Verified: `npx tsc --noEmit` and `npm run build` both pass; two pre-existing unrelated errors
  (`exercise-browser.tsx`, `ClientUpdatesPanel.tsx`) confirmed identical before/after via
  `git stash`.

### Pass 2 — restyle the four kept-as-is tabs (commit `211f3f7`)
Craig confirmed after Pass 1 deployed that Compliance/Training/Plan Agent/Updates still looked
visually old next to the redesigned Overview/Profile. Investigation found their cards, table
styling, and badge tokens were **already** aligned with the design system (already using
`HubCard`/`HubCardHeader` with the `color` prop, `StatusBadge`, the same border/hover table
conventions as the newly-restyled Training tab) — the one real, consistent mismatch was
**pill-shaped (`rounded-full`) buttons** where the mockup calls for `rounded-lg` (8px), per its own
explicit comment ("Hub buttons are rounded-lg (8px), NOT the 48px marketing pill").
Fixed (styling-only, no logic/props changed) in: `components/hub/DocumentRegister.tsx`,
`components/hub/SendDocumentLink.tsx`, `components/hub/ClinicalComplianceCard.tsx`,
`components/hub/ClientUpdatesPanel.tsx`, `components/hub/UpdateRowActions.tsx`,
`app/hub/(protected)/clients/[id]/PlanAgentTab.tsx` (button + chat-header icon radius).
`components/hub/GpLetterCard.tsx` had nothing to restyle (no bespoke buttons/badges/card wrapper).
Verified: `npx tsc --noEmit` clean (same two pre-existing errors, confirmed unrelated) + a full
`npm run build` passed clean.

### Flagged, not done
- `components/hub/PackagePaymentsCard.tsx` has the same `rounded-full` button pattern as the fixed
  files but was out of scope for this pass — Craig has not yet said whether to include it.
- Email-button "greyed out" report still needs Craig to confirm which client he tested with (real
  missing email vs. a genuine bug in the check).

### Deployed
Both commits pushed to `origin/main` (`2acaf4e`, then `211f3f7`) with Craig's explicit go-ahead
each time. Coolify auto-deploys on push to this repo (confirmed via deployment history — both
commits show `status: finished` within ~3 minutes of push) — live on
`https://staging.eternal-fitness.co.uk`.
