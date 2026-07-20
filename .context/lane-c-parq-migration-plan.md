# Lane C, Unit 1 — PAR-Q → Document Engine Migration Plan

**Work Order:** eternal-fitness-hub-consolidation-2026-07-20.md (Lane C, unit 1)
**Date:** 2026-07-20
**Status:** PLANNING ONLY — no migration executed, no DB connection made.

> **FILE-BASED READ ONLY — NOT A LIVE-DB CONFIRMATION.**
> The schema below was reconstructed exclusively from the migration SQL files in
> `supabase/migrations/` of this repo. There is **no database tunnel open this session**
> and **no connection to production Postgres was attempted or made**. Columns and RLS
> policies reflect the cumulative effect of every migration that touches `signed_parq`,
> `document_templates`, and `client_documents`. Before any migration is run, Craig must
> open the Coolify SSH tunnel and this plan must be re-verified against the live schema
> (e.g. `\\d signed_parq` / `\\d client_documents` in psql) — a migration could have been
> applied to production outside this repo's history.

---

## 1. Current `signed_parq` schema (reconstructed from migrations)

Sources: `20260521_signed_parq.sql` (base), `20260603_link_client_documents.sql` +
`20260603_client_documents_complete.sql` (client_id, status fields), `20260710120000_parq_versioning.sql`
(versioning).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `client_id` | UUID → `clients(id)` | added later (NOT in base create) |
| `full_name` | TEXT NOT NULL | |
| `date_of_birth` | DATE | |
| `address` | TEXT | |
| `email` | TEXT | |
| `phone` | TEXT | |
| `emergency_contact_name` | TEXT | |
| `emergency_contact_phone` | TEXT | |
| `gp_name` | TEXT | |
| `gp_surgery` | TEXT | |
| `gp_phone` | TEXT | |
| `q1`–`q11` | TEXT | `CHECK IN ('yes','no','')` — Section 2 (Cardiovascular/General) |
| `q12`–`q18` | TEXT | `CHECK IN ('yes','no','')` — Section 3 (Musculoskeletal/Neuro/Surgical) |
| `q19`–`q26` | TEXT | `CHECK IN ('yes','no','')` — Section 4 (Blood/Medication/Diagnosed) |
| `conditions` | TEXT | Section 5 |
| `medications` | TEXT | |
| `devices` | TEXT | |
| `exercise_restrictions` | TEXT | |
| `surgeries` | TEXT | |
| `other_info` | TEXT | |
| `current_exercise` | TEXT | Section 6 |
| `training_goals` | TEXT | |
| `q27`,`q28`,`q29` | TEXT | `CHECK IN ('yes','no','')` — Section 6 lifestyle |
| `client_name_print` | TEXT | Section 9 declaration |
| `client_signature_date` | DATE | |
| `client_signature_data` | TEXT | (canvas signature data; may be null — import script uses typed sig instead) |
| `client_typed_signature` | TEXT | typed name used as signature |
| `signed_at` | TIMESTAMPTZ | default NOW() |
| `created_at` | TIMESTAMPTZ | default NOW() |
| `status` | TEXT | `CHECK IN ('draft','sent','received','signed','expired','needs_update','superseded')` |
| `sent_date` | DATE | added later |
| `received_date` | DATE | added later |
| `requires_update` | BOOLEAN | added later |
| `update_notes` | TEXT | added later |
| `version` | INTEGER | default 1 (parq_versioning) |
| `supersedes_id` | UUID → `signed_parq(id)` | versioning chain |
| `signed_by_ip` | TEXT | |
| `signed_by_user_agent` | TEXT | |
| `updated_at` | TIMESTAMPTZ | |

**RLS:** enabled. Policies (current, after later migrations dropped/recreated) — authenticated-only
SELECT/INSERT/UPDATE/DELETE. The original `anon` INSERT policy was dropped; the table is now
authenticated-only. This is the source of the Colin-flow caveat in `charter-document-engine.md`.

**Indexes:** `idx_parq_full_name`, `idx_parq_signed_at`, `idx_parq_dob`, `idx_parq_client_id`.

**29-question structure** (matches `scripts/import-parq.mjs` `QUESTION_KEYS = q1..q29`):
- Section 2 (q1–q11), Section 3 (q12–q18), Section 4 (q19–q26), Section 6 (q27–q29).
- Free-text detail captured in `conditions`/`medications`/`devices`/`exercise_restrictions`/
  `surgeries`/`other_info`.
- Lifestyle: `current_exercise`, `training_goals`.

---

## 2. Current `document_templates` / `client_documents` schema

Sources: `20260704_document_engine.sql` (base tables + DUMMY terms seed),
`20260704_risk_and_review_templates.sql` (risk_assessment + annual_review seeds),
`20260704_terms_real_content.sql` (real T&Cs).

### `document_templates`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `kind` | TEXT NOT NULL | `'terms'`,`'risk_assessment'`,`'annual_review'`, (future `'parq'`) |
| `name` | TEXT NOT NULL | |
| `version` | INTEGER | default 1 |
| `body` | JSONB | `{ "intro"?: string, "sections": [{ "id", "title", "html" }] }` |
| `requires_client_signature` | BOOLEAN | default true |
| `requires_trainer_signature` | BOOLEAN | default false |
| `is_active` | BOOLEAN | default true |
| `created_at`,`updated_at` | TIMESTAMPTZ | |

### `client_documents`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `client_id` | UUID → `clients(id)` CASCADE | |
| `kind` | TEXT NOT NULL | mirrors template kind |
| `title` | TEXT NOT NULL | |
| `template_id` | UUID → `document_templates(id)` | |
| `template_version` | INTEGER | |
| `body` | JSONB | editable snapshot of template body |
| `requires_client_signature` | BOOLEAN | |
| `requires_trainer_signature` | BOOLEAN | |
| `status` | TEXT | `CHECK IN ('draft','sent','signed','superseded')` |
| `version` | INTEGER | default 1 |
| `supersedes_id` | UUID → `client_documents(id)` | |
| `client_name` | TEXT | |
| `client_signature` | TEXT | signature value (typed name or data) |
| `client_signed_date` | DATE | |
| `trainer_name` | TEXT | |
| `trainer_signature` | TEXT | |
| `trainer_signed_date` | DATE | |
| `sent_at` | TIMESTAMPTZ | |
| `signed_at` | TIMESTAMPTZ | |
| `created_at`,`updated_at` | TIMESTAMPTZ | |

**RLS:** enabled. Authenticated-only ALL on both via service-role API routes for public signing
(no anon policies — the engine deliberately avoids the `signed_parq` anon-read pitfall).

**Seeded templates today:** `terms` (real Craig copy), `risk_assessment` (dual-signed),
`annual_review` (dual-signed). No `parq` template yet — that is the gap this plan fills.

---

## 3. Field-mapping plan — PAR-Q `document_templates` entry

A new template `kind = 'parq'`, `name = 'PAR-Q Medical Screening'`, version 1,
`requires_client_signature = true`, `requires_trainer_signature = false` (PAR-Q is client-declared;
trainer countersign is captured by the separate Risk Assessment — keep parity with the legacy
single-signature PAR-Q).

The 29 questions and free-text detail map into `body.sections[].html` so the engine renders the
same form. Because the engine body is rendered HTML (not a form model), the **structured data for
each client lives in the `client_documents.body` snapshot** as a superset: we store both the
rendered HTML sections AND a `data` block carrying the q1–q29 answers + detail fields. This keeps
the document human-readable (renders like the legacy form) while preserving the machine-readable
answers for clearance logic (the `anyYes` → `medical_clearance_status` rule the import script uses).

### Recommended `body` JSON shape for the PAR-Q template

```json
{
  "intro": "<p>This Physical Activity Readiness Questionnaire (PAR-Q) ... </p>",
  "sections": [
    { "id": "personal", "title": "Personal details",
      "html": "<table>... full_name, date_of_birth, address, email, phone, emergency contact, GP ...</table>" },
    { "id": "s2", "title": "Section 2 — Cardiovascular & general health",
      "html": "<ol>q1..q11 questions as text</ol>" },
    { "id": "s3", "title": "Section 3 — Musculoskeletal, neurological & surgical",
      "html": "<ol>q12..q18</ol>" },
    { "id": "s4", "title": "Section 4 — Blood conditions, medications & diagnosed conditions",
      "html": "<ol>q19..q26</ol>" },
    { "id": "s5", "title": "Section 5 — Full details",
      "html": "conditions / medications / devices / exercise_restrictions / surgeries / other_info" },
    { "id": "s6", "title": "Section 6 — Lifestyle & physical activity",
      "html": "current_exercise / training_goals + q27..q29" },
    { "id": "decl", "title": "Declaration & signature",
      "html": "client_name_print / client_signature_date / client_typed_signature" }
  ],
  "data": {
    "answers": { "q1": "...", ... "q29": "..." },
    "details": {
      "conditions": "", "medications": "", "devices": "",
      "exercise_restrictions": "", "surgeries": "", "other_info": "",
      "current_exercise": "", "training_goals": ""
    },
    "personal": {
      "full_name": "", "date_of_birth": "", "address": "", "email": "", "phone": "",
      "emergency_contact_name": "", "emergency_contact_phone": "",
      "gp_name": "", "gp_surgery": "", "gp_phone": ""
    },
    "signature": {
      "client_name_print": "", "client_signature_date": "", "client_typed_signature": "",
      "client_signature_data": ""
    }
  }
}
```

The `data` block is the contractual mapping target from each `signed_parq` row (see §4).

### Mapping table (signed_parq → client_documents.body.data)

| signed_parq column | client_documents.body.data path |
|---|---|
| `full_name` … `gp_phone` (11 cols) | `data.personal.*` |
| `q1`–`q29` | `data.answers.q1`–`q29` |
| `conditions`,`medications`,`devices`,`exercise_restrictions`,`surgeries`,`other_info` | `data.details.*` |
| `current_exercise`,`training_goals` | `data.details.current_exercise` / `.training_goals` |
| `client_name_print` | `data.signature.client_name_print` |
| `client_signature_date` | `data.signature.client_signature_date` |
| `client_typed_signature` | `data.signature.client_typed_signature` |
| `client_signature_data` | `data.signature.client_signature_data` (may be null) |

### Top-level client_documents field mapping

| signed_parq | client_documents | Rule |
|---|---|---|
| `client_id` | `client_id` | direct |
| `'parq'` | `kind` | constant |
| `full_name || ' — PAR-Q'` | `title` | e.g. "Sarah Tyler — PAR-Q" |
| parq template `id` | `template_id` | resolved at migration time |
| `1` (or `version`) | `template_version` | snapshot the template version in force |
| built JSON above | `body` | full snapshot (html sections + data) |
| `true` | `requires_client_signature` | |
| `false` | `requires_trainer_signature` | |
| `status` (map `needs_update`→`sent`? see note) | `status` | `draft/sent/signed/superseded` only in engine. Map legacy `received`→`sent`, `expired`→`draft`, `needs_update`→`sent` (still outstanding), `superseded`→`superseded`. |
| `client_typed_signature` (or `_data`) | `client_signature` | |
| `client_name_print` | `client_name` | |
| `client_signature_date` | `client_signed_date` | |
| `version` | `version` | preserve version chain |
| `supersedes_id` (mapped to new doc id) | `supersedes_id` | re-point after insert |
| `signed_at` | `signed_at` | preserve timestamp |
| `sent_date`→`sent_at` | `sent_at` | if present |

> **Clearance logic note:** the import script sets `clients.medical_clearance_status` and
> `client_tracker.clearance_status` from `anyYes` over q1–q29. The migration must **recompute and
> preserve** this — after snapshotting, re-run the same `anyYes` derivation per row and UPDATE the
> client/tracker rows so parity is exact. This keeps the migration side-effect-free with respect to
> existing clearance state (idempotent if re-run).

---

## 4. Migration script skeleton (DO NOT RUN — file only)

This is a skeleton for `scripts/migrate-parq-to-engine.mjs` (or a SQL migration). It is **not
executed**, **not connected to any database**, and is provided for review + Craig's per-session
go-ahead (per Work Order `[GATE]`).

```js
#!/usr/bin/env node
// SKELETON ONLY — DO NOT RUN. Requires Craig's per-session DB go-ahead + open tunnel.
// File-based schema assumed; re-verify against live DB before execution.
//
// Steps:
//  1. Load parq template id (kind='parq') — created by a prior migration/seeding step.
//  2. SELECT every signed_parq row (oldest→newest to preserve version chains).
//  3. For each row, build the client_documents.body JSON (html sections + data block) per §3.
//  4. INSERT into client_documents, capturing the new id.
//  5. Re-point supersedes_id (legacy signed_parq.supersedes_id → new client_documents.id map).
//  6. Recompute anyYes → UPDATE clients.medical_clearance_status + client_tracker.clearance_*.
//  7. VERIFY 1:1: every signed_parq.id has exactly one client_documents row; spot-check 3+.
//  8. (GATED — separate step, after parity proven) Deprecate/retire signed_parq + /agreement form.

import { Pool } from "pg";
// const pool = new Pool({ connectionString: process.env.DATABASE_URL, ... });

// const PARQ_TEMPLATE_KIND = "parq";
// const QUESTION_KEYS = Array.from({ length: 29 }, (_, i) => `q${i + 1}`);

function buildBody(row) {
  // Build { intro, sections:[...html...], data:{ answers, details, personal, signature } }
  // per section 3 of .context/lane-c-parq-migration-plan.md
  throw new Error("implement per mapping table");
}

async function main() {
  // 1. const { rows: [tpl] } = await pool.query(
  //   `SELECT id, version FROM document_templates WHERE kind = $1 AND is_active`,
  //   [PARQ_TEMPLATE_KIND]);
  // 2. const { rows: parqs } = await pool.query(
  //   `SELECT * FROM signed_parq ORDER BY created_at ASC`);
  // 3-6. for (const p of parqs) { ... INSERT ... ; map supersedes ... ; recompute clearance }
  // 7. verification query: count mismatch between signed_parq and client_documents(parq)
  console.log("SKELETON — not executed.");
}

// main().catch(...)
```

**SQL companion migration (template seed)** — to be applied by Craig via dashboard/CLI (engine
already supports a parq `kind`; this just adds the template row):

```sql
-- seed_parq_template.sql (SKELETON — applies the §3 body JSON; not run this session)
INSERT INTO document_templates (kind, name, version, requires_client_signature, requires_trainer_signature, body)
SELECT 'parq', 'PAR-Q Medical Screening', 1, true, false, $json$ { /* §3 body */ } $json$::jsonb
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE kind = 'parq');
```

---

## 5. Parity & verification checklist (pre-retirement)

- [ ] Every `signed_parq` row → exactly one `client_documents` row with `kind='parq'`.
- [ ] `client_id` matches between legacy and engine rows.
- [ ] q1–q29 answers byte-equal in `body.data.answers`.
- [ ] `medical_clearance_status` / `client_tracker.clearance_*` unchanged after migration.
- [ ] `signed_at`, `client_signed_date`, version chains preserved.
- [ ] Spot-check ≥3 real clients (e.g. Sarah Tyler, Colin Farley, one with a YES answer).
- [ ] Colin-flow caveat resolved: post-migration the PAR-Q resume link reads via the engine's
      service-role public route, not `signed_parq` anon RLS (which is authenticated-only).

## 6. Gates (from Work Order)

- `[GATE]` Running the migration against production Postgres — Craig's explicit go-ahead.
- `[GATE]` Retiring `signed_parq` / bespoke `/agreement` form — only after parity proven.
