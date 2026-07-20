# Lane A, Unit 1 — Clients table field-by-field map

**Audit date:** 2026-07-20
**Scope:** Read-only research on local files. No DB connection, no migrations run, no production touched.
**Primary files:** `supabase/migrations/20260509_training_app.sql` (base table), `20260603_seed_clients.sql` (seed), `20260630_client_profile_extensions.sql` (profile extensions), `20260704_client_master_consolidation.sql` (master consolidation + `client_documents_summary` view).

> **Important scoping note:** the four named migrations do **not** define every `clients` column. The `client_documents_summary` view rebuilt in `20260704_client_master_consolidation.sql` references columns that are added by *other* migrations (`client_number`, `display_code`, `gp_letter_*`, `annual_review_due_date`, `clearance_from`, `specialist_name`, `email`, `phone`, `block_summaries`). Those are listed below under "Columns sourced from other migrations (referenced by the consolidation view)" so the map is complete. The maps of liveness come from grepping `app/`, `lib/`, `components/`, `hooks/` for each column name.

## Field-by-field map

### Base table — `20260509_training_app.sql`
| Column | Type | Added by | Live in app? | Notes |
|---|---|---|---|---|
| `id` | UUID PK | base | ✅ Yes | Primary key, used everywhere (routes, joins). |
| `name` | TEXT NOT NULL | base | ✅ Yes | Display name; heavily used (table, edit, search). |
| `age` | INTEGER | base | ✅ Yes | Read in client edit/detail + `profile` summaries (5 files). |
| `gender` | TEXT | base | ✅ Yes | Read in client edit/detail (4 files). |
| `profile` | JSONB NOT NULL DEFAULT `{}` | base | ✅ Yes | Core free-form profile blob. 28 files read it (logistics, goals, notes, etc.). |
| `created_at` | TIMESTAMPTZ DEFAULT NOW() | base | ✅ Yes | Used for ordering in API + view. |

### Profile extensions — `20260630_client_profile_extensions.sql`
| Column | Type | Live in app? | Notes |
|---|---|---|---|
| `compliance_status` | TEXT (enum: clear / action_needed / do_not_train / pending_medical) DEFAULT action_needed | ✅ Yes | Drives the clients table filter + compliance cards (7 files). |
| `outstanding_actions` | TEXT[] DEFAULT `{}` | ✅ Yes | Shown/edited in client detail (5 files). |
| `group_type` | TEXT (enum: individual_journey / calendar_block) DEFAULT individual_journey | ✅ Yes | Read in detail/edit (4 files). |
| `pace_mode` | TEXT (enum: fast / medium / slow) DEFAULT medium | ✅ Yes | Read in detail/edit (5 files). |

> Seed in `20260603_seed_clients.sql` inserts 15 clients (Amanda Munday … Tom Putnam) with name only; `20260630` then UPDATE-seeds compliance/group/pace + `outstanding_actions` for each by name. Note: `20260603_seed_clients.sql` also inserts into `client_tracker` (clearance_status='NOT YET REQUESTED', clearance_required='NA') — that table is historical, see dead-column note below.

### Master consolidation — `20260704_client_master_consolidation.sql`
| Column | Type | Live in app? | Notes |
|---|---|---|---|
| `package_type` | TEXT | ✅ Yes | `PackagePaymentsCard` reads/writes (6 files). |
| `sessions_purchased` | INTEGER | ✅ Yes | Read in detail/edit (6 files). |
| `sessions_used` | INTEGER DEFAULT 0 | ✅ Yes | Read in detail/edit (6 files). |
| `sessions_remaining` | INTEGER | ✅ Yes | Read in detail/edit (6 files). Computed display. |
| `session_duration` | INTEGER DEFAULT 60 | ✅ Yes | Read in detail/edit (6 files). |
| `payment_method` | TEXT | ✅ Yes | Read in detail/edit (6 files). |
| `payment_status` | TEXT (enum: paid / deposit / pending / overdue / suspended) DEFAULT pending | ✅ Yes | `PackagePaymentsCard` reads/writes (6 files). |
| `block_expiry_date` | DATE | ✅ Yes | Read in detail/edit (6 files). |
| `client_status` | TEXT (enum: active / inactive / completed / suspended) DEFAULT active | ✅ Yes | Read in detail/edit (6 files). |
| `referral_source` | TEXT | ✅ Yes | Read in detail/edit (6 files). |
| `medical_clearance_status` | TEXT (enum: cleared / pending / not_required / not_yet_requested) DEFAULT not_required | ✅ Yes | `ClinicalComplianceCard` reads/writes (6 files). |
| `risk_level` | TEXT (enum: low / medium / high) DEFAULT low | ✅ Yes | Read in detail/edit (6 files). |
| `exercise_modifications` | TEXT | ✅ Yes | `ClinicalComplianceCard` reads/writes (6 files). |

This migration also **drops and rebuilds** `client_documents_summary` (view), sourcing clearance from `clients` now.

### Columns sourced from other migrations (referenced by the consolidation view, NOT in the four named files)
| Column | Type | Added by | Live in app? | Notes |
|---|---|---|---|---|
| `client_number` | INTEGER | `20260603_client_documents_complete.sql` + `20260603_fix_link_existing_docs.sql` | ✅ Yes | Primary lookup key in API (`eq("client_number", …)`), routing, reports (31 files). |
| `display_code` | TEXT (initials) | `20260603_client_documents_complete.sql` + `20260603_fix_link_existing_docs.sql` | ⚠️ View-only / effectively dead | **Zero references in `app/`/`lib/`/`components/`/`hooks/`** — only selected inside SQL views (`client_documents_summary`). UI computes initials on the fly (`InitialsCircle` in `clients-table.tsx`). |
| `email` | TEXT | `20260704_client_contact.sql` | ✅ Yes | Used heavily (44 files) for 6-week update sends + client contact. |
| `phone` | TEXT | `20260704_client_contact.sql` | ✅ Yes | Read in client detail/edit (16 files). |
| `gp_letter_status` | TEXT (enum: not_required / requested / received) DEFAULT not_required | `20260704_compliance_unification.sql` | ✅ Yes | `GpLetterCard` reads/writes (4 files). |
| `gp_letter_requested_date` | DATE | `20260704_compliance_unification.sql` | ✅ Yes | `GpLetterCard` (6 files). |
| `gp_letter_received_date` | DATE | `20260704_compliance_unification.sql` | ✅ Yes | `GpLetterCard` (6 files). |
| `annual_review_due_date` | DATE | `20260704_compliance_unification.sql` | ✅ Yes | Read in compliance/doc views (5 files). Backfilled from `client_tracker`. |
| `clearance_from` | TEXT | `20260704_compliance_unification.sql` | ⚠️ Dead in app | **Zero references in TS/TSX.** Added on `clients` + backfilled from `client_tracker`, but the app still reads the equivalent `medical_clearance_from` from the **`signed_agreements`** table, not from `clients.clearance_from`. |
| `specialist_name` | TEXT | `20260704_compliance_unification.sql` | ⚠️ Dead in app | **Zero references in TS/TSX.** Same situation as `clearance_from` — app reads it off `signed_agreements` (no `specialist_name` there either; never surfaced). |
| `block_summaries` | JSONB DEFAULT `[]` | `20260701_six_week_updates.sql` | ✅ Yes | Structured 6-week update data, 2 files (type + update builder). |

## Dead / unused columns flagged

Grep target: `app/`, `lib/`, `components/`, `hooks/` (excludes `node_modules`, `supabase/`).

1. **`clients.display_code`** — ⚠️ DEAD in application code. Only referenced inside SQL `client_documents_summary` views. The UI derives initials locally (`InitialsCircle` in `app/hub/(protected)/clients/clients-table.tsx`). Safe to keep for the view, but not a real app field.
2. **`clients.clearance_from`** — ⚠️ DEAD in application code. Backfilled from `client_tracker` in `20260704_compliance_unification.sql`, but nothing in `app/`/`lib/` reads `clients.clearance_from`. The client detail/agreement screens read `medical_clearance_from` from `signed_agreements` instead. Possible consolidation gap — the field was moved to `clients` but the read path was never repointed.
3. **`clients.specialist_name`** — ⚠️ DEAD in application code. Same as above; never read anywhere in TS/TSX.

### Related dead surface (not a `clients` column, but relevant to consolidation)
- **`client_tracker` table** — `20260603_seed_clients.sql` seeds 15 rows here, and `20260603_client_documents_complete.sql` / `20260704_compliance_unification.sql` both read from it. `20260704_compliance_unification.sql` explicitly says it is "left in place as historical record but is no longer written to by the app going forward." The `client_documents_summary` view was rebuilt in `20260704_client_master_consolidation.sql` to **drop** the `client_tracker` clearance join — so the tracker's clearance data is now orphaned (superseded by `clients.gp_letter_*` etc.), except `clearance_from`/`specialist_name` which were backfilled from it but are themselves dead (see above).

## Summary for Lane A
- The `clients` row is now the intended single source of truth for per-client commercial + clinical + compliance state. Every consolidation column (`20260704`) is actively read/written by the hub UI.
- The only genuinely unused `clients` columns are **`display_code`** (view-only), **`clearance_from`**, and **`specialist_name`** — the latter two are a consolidation loose-end: the data lives on `clients` but the read path still points at `signed_agreements`.
- No `clients` columns were found that are both added AND never referenced anywhere (all base/extension/consolidation columns are live except the three noted).
