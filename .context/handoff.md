# Handoff

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
