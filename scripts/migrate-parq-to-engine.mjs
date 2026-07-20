#!/usr/bin/env node
// Lane C, Unit 2 — Snapshot every existing signed_parq row into client_documents.
//
// FILE-BASED / PLANNING ONLY. DO NOT RUN THIS SESSION.
// No database connection was made. Craig's explicit per-session DB go-ahead
// (Work Order [GATE]) AND an open Coolify SSH tunnel (127.0.0.1:5433 ->
// 10.10.10.2:5432, role ef_app) are REQUIRED before this script is ever
// executed. It is written for review only.
//
// Purpose: backfill the document engine so every legacy signed_parq row has a
// verified client_documents equivalent (kind='parq'). This is Phase 4 of
// charter-document-engine.md — no legacy row is touched/deleted here; the
// retirement of signed_parq is a SEPARATE, gated step after parity is proven.
//
// Style mirrors scripts/import-parq.mjs (pg Pool, type parsers, DATABASE_URL).
//
// ---------------------------------------------------------------------------
// 1:1 FIELD MAPPING — signed_parq -> client_documents (and -> body.data)
// ---------------------------------------------------------------------------
// Top-level client_documents columns:
//   signed_parq.client_id                     -> client_documents.client_id        (direct)
//   'parq'                                    -> kind                              (constant)
//   signed_parq.full_name || ' — PAR-Q'       -> title                             (e.g. "Sarah Tyler — PAR-Q")
//   (resolved at runtime) parq template id    -> template_id                       (kind='parq' AND is_active)
//   signed_parq.version                       -> template_version                  (snapshot template version in force)
//   built JSON (see buildBody)                -> body                             (html sections + data block)
//   true                                      -> requires_client_signature
//   false                                     -> requires_trainer_signature
//   mapped legacy status                      -> status                           (see STATUS_MAP below)
//   signed_parq.client_typed_signature
//     or client_signature_data                -> client_signature
//   signed_parq.client_name_print             -> client_name
//   signed_parq.client_signature_date         -> client_signed_date
//   signed_parq.version                       -> version                          (preserve version chain)
//   re-pointed legacy supersedes_id           -> supersedes_id                    (mapped to new doc id)
//   signed_parq.signed_at                     -> signed_at                        (preserve timestamp)
//   signed_parq.sent_date                     -> sent_at                          (if present)
//
// body.data blocks (nested in the client_documents.body JSONB):
//   personal.*        <- full_name, date_of_birth, address, email, phone,
//                          emergency_contact_name, emergency_contact_phone,
//                          gp_name, gp_surgery, gp_phone
//   answers.q1..q29   <- q1..q29
//   details.*         <- conditions, medications, devices, exercise_restrictions,
//                          surgeries, other_info, current_exercise, training_goals
//   signature.*       <- client_name_print, client_signature_date,
//                          client_typed_signature, client_signature_data
//
// Clearance side-effect (preserve existing state, idempotent if re-run):
//   anyYes = QUESTION_KEYS.some(q => row[q] === 'yes')
//   => UPDATE clients.medical_clearance_status = anyYes ? 'pending' : 'not_required'
//   => UPDATE client_tracker SET clearance_status = anyYes ? 'PENDING' : 'NOT REQUIRED',
//                              clearance_required = anyYes ? 'Y' : 'N'
//   (This re-derives what import-parq.mjs set originally — parity-safe.)
//
// STATUS_MAP (engine only allows draft/sent/signed/superseded):
//   'signed'        -> 'signed'
//   'draft'         -> 'draft'
//   'superseded'    -> 'superseded'
//   'received'      -> 'sent'        (legacy: trainer received, outstanding client action)
//   'sent'          -> 'sent'
//   'expired'       -> 'draft'       (no longer valid; would be re-issued)
//   'needs_update'  -> 'sent'        (still outstanding — client must update)
//
// ---------------------------------------------------------------------------

import { Pool, types } from "pg";

// Keep DATE/TIMESTAMP/TIMESTAMPTZ as plain strings, matching import-parq.mjs.
types.setTypeParser(1114, (v) => v);
types.setTypeParser(1184, (v) => v);
types.setTypeParser(1082, (v) => v);

const PARQ_TEMPLATE_KIND = "parq";
const QUESTION_KEYS = Array.from({ length: 29 }, (_, i) => `q${i + 1}`);

const PERSONAL_KEYS = [
  "full_name", "date_of_birth", "address", "email", "phone",
  "emergency_contact_name", "emergency_contact_phone",
  "gp_name", "gp_surgery", "gp_phone",
];
const DETAIL_KEYS = [
  "conditions", "medications", "devices", "exercise_restrictions",
  "surgeries", "other_info", "current_exercise", "training_goals",
];
const SIGNATURE_KEYS = [
  "client_name_print", "client_signature_date",
  "client_typed_signature", "client_signature_data",
];

const STATUS_MAP = {
  signed: "signed",
  draft: "draft",
  superseded: "superseded",
  received: "sent",
  sent: "sent",
  expired: "draft",
  needs_update: "sent",
};

// Build the client_documents.body JSONB payload per the mapping above.
// Returns the structured object (to be passed as a jsonb param).
function buildBody(row) {
  const answers = {};
  for (const q of QUESTION_KEYS) answers[q] = row[q] ?? "";

  const details = {};
  for (const k of DETAIL_KEYS) details[k] = row[k] ?? "";

  const personal = {};
  for (const k of PERSONAL_KEYS) personal[k] = row[k] ?? "";

  const signature = {};
  for (const k of SIGNATURE_KEYS) signature[k] = row[k] ?? null;

  const structuredData = JSON.stringify({ answers, details, personal, signature });

  return {
    intro:
      "<p>The Physical Activity Readiness Questionnaire (PAR-Q) is designed to help determine if you should check with your doctor before becoming much more physically active. This is a snapshot of the original signed submission, migrated onto the Eternal Fitness document engine.</p>",
    sections: [
      {
        id: "personal",
        title: "Personal details",
        html: `<table><tbody>` +
          `<tr><td><strong>Full name</strong></td><td>${personal.full_name ?? ""}</td></tr>` +
          `<tr><td><strong>Date of birth</strong></td><td>${personal.date_of_birth ?? ""}</td></tr>` +
          `<tr><td><strong>Address</strong></td><td>${personal.address ?? ""}</td></tr>` +
          `<tr><td><strong>Email</strong></td><td>${personal.email ?? ""}</td></tr>` +
          `<tr><td><strong>Phone</strong></td><td>${personal.phone ?? ""}</td></tr>` +
          `<tr><td><strong>Emergency contact</strong></td><td>${personal.emergency_contact_name ?? ""} — ${personal.emergency_contact_phone ?? ""}</td></tr>` +
          `<tr><td><strong>GP name</strong></td><td>${personal.gp_name ?? ""}</td></tr>` +
          `<tr><td><strong>GP surgery</strong></td><td>${personal.gp_surgery ?? ""}</td></tr>` +
          `<tr><td><strong>GP phone</strong></td><td>${personal.gp_phone ?? ""}</td></tr>` +
          `</tbody></table>`,
      },
      {
        id: "s2",
        title: "Section 2 — Cardiovascular & general health",
        html:
          "<ol>" +
          QUESTION_KEYS.slice(0, 11).map((q) => `<li>${q}: ${row[q] ?? ""}</li>`).join("") +
          "</ol>",
      },
      {
        id: "s3",
        title: "Section 3 — Musculoskeletal, neurological & surgical",
        html:
          "<ol>" +
          QUESTION_KEYS.slice(11, 18).map((q) => `<li>${q}: ${row[q] ?? ""}</li>`).join("") +
          "</ol>",
      },
      {
        id: "s4",
        title: "Section 4 — Blood conditions, medications & diagnosed conditions",
        html:
          "<ol>" +
          QUESTION_KEYS.slice(18, 26).map((q) => `<li>${q}: ${row[q] ?? ""}</li>`).join("") +
          "</ol>",
      },
      {
        id: "s5",
        title: "Section 5 — Full details",
        html: `<table><tbody>` +
          `<tr><td><strong>Conditions</strong></td><td>${details.conditions}</td></tr>` +
          `<tr><td><strong>Medications</strong></td><td>${details.medications}</td></tr>` +
          `<tr><td><strong>Devices / implants</strong></td><td>${details.devices}</td></tr>` +
          `<tr><td><strong>Exercise restrictions</strong></td><td>${details.exercise_restrictions}</td></tr>` +
          `<tr><td><strong>Surgeries</strong></td><td>${details.surgeries}</td></tr>` +
          `<tr><td><strong>Other info</strong></td><td>${details.other_info}</td></tr>` +
          `<tr><td><strong>Current exercise</strong></td><td>${details.current_exercise}</td></tr>` +
          `<tr><td><strong>Training goals</strong></td><td>${details.training_goals}</td></tr>` +
          `</tbody></table>`,
      },
      {
        id: "s6",
        title: "Section 6 — Lifestyle & physical activity",
        html:
          `<p><strong>Current exercise:</strong> ${details.current_exercise}</p>` +
          `<p><strong>Training goals:</strong> ${details.training_goals}</p>` +
          "<ol>" +
          QUESTION_KEYS.slice(26, 29).map((q) => `<li>${q}: ${row[q] ?? ""}</li>`).join("") +
          "</ol>",
      },
      {
        id: "decl",
        title: "Declaration & signature",
        html: `<table><tbody>` +
          `<tr><td><strong>Name (printed)</strong></td><td>${signature.client_name_print ?? ""}</td></tr>` +
          `<tr><td><strong>Signature</strong></td><td>${signature.client_typed_signature ?? ""}</td></tr>` +
          `<tr><td><strong>Date</strong></td><td>${signature.client_signature_date ?? ""}</td></tr>` +
          `</tbody></table>`,
      },
      {
        id: "data",
        title: "Structured answers (machine-readable)",
        html: `<p><em>Raw q1–q29 answers and detail fields, mirrored from body.data.</em></p><pre>${structuredData}</pre>`,
      },
    ],
    data: { answers, details, personal, signature },
  };
}

async function main() {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    console.error("DATABASE_URL is not set. Open the Coolify SSH tunnel first, then retry.");
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: cs,
    ssl: !/127\.0\.0\.1|localhost/.test(cs) ? { rejectUnauthorized: false } : false,
  });

  try {
    // 1. Resolve the active PAR-Q template (seeded by 20260720_seed_parq_template.sql).
    const { rows: tplRows } = await pool.query(
      `SELECT id, version FROM document_templates WHERE kind = $1 AND is_active ORDER BY version DESC LIMIT 1`,
      [PARQ_TEMPLATE_KIND]
    );
    if (tplRows.length === 0) {
      throw new Error("No active 'parq' document_templates row found. Run 20260720_seed_parq_template.sql first.");
    }
    const tpl = tplRows[0];

    // 2. Select every signed_parq row, oldest first to preserve version chains.
    const { rows: parqs } = await pool.query(
      `SELECT * FROM signed_parq ORDER BY created_at ASC, version ASC`
    );
    console.log(`Found ${parqs.length} signed_parq rows to snapshot.`);

    // Map legacy signed_parq.id -> new client_documents.id (for supersedes re-pointing).
    const idMap = new Map();

    for (const p of parqs) {
      const anyYes = QUESTION_KEYS.some((q) => p[q] === "yes");
      const body = buildBody(p);
      const status = STATUS_MAP[p.status] ?? "draft";
      const clientSignature = p.client_typed_signature || p.client_signature_data || null;
      const title = `${p.full_name} — PAR-Q`;

      // 3-4. Insert the snapshot, capturing the new id.
      const { rows: inserted } = await pool.query(
        `INSERT INTO client_documents (
           client_id, kind, title, template_id, template_version, body,
           requires_client_signature, requires_trainer_signature, status, version,
           client_name, client_signature, client_signed_date,
           signed_at, sent_at, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING id`,
        [
          p.client_id, PARQ_TEMPLATE_KIND, title, tpl.id, tpl.version,
          body,
          true, false, status, p.version ?? 1,
          p.client_name_print ?? p.full_name, clientSignature, p.client_signature_date ?? null,
          p.signed_at ?? null, p.sent_date ?? null, p.created_at ?? new Date().toISOString(), p.updated_at ?? new Date().toISOString(),
        ]
      );
      const newId = inserted[0].id;
      idMap.set(p.id, newId);

      // Preserve clearance side-effect (idempotent).
      const clearanceStatus = anyYes ? "pending" : "not_required";
      const trackerStatus = anyYes ? "PENDING" : "NOT REQUIRED";
      const trackerRequired = anyYes ? "Y" : "N";
      if (p.client_id) {
        await pool.query(
          `UPDATE clients SET medical_clearance_status = $1 WHERE id = $2`,
          [clearanceStatus, p.client_id]
        );
        await pool.query(
          `UPDATE client_tracker SET clearance_status = $1, clearance_required = $2 WHERE client_id = $3`,
          [trackerStatus, trackerRequired, p.client_id]
        );
      }

      console.log(`  snapshotted ${p.full_name} (legacy ${p.id} -> doc ${newId}) anyYes=${anyYes}`);
    }

    // 5. Re-point supersedes_id from legacy signed_parq.supersedes_id to new doc ids.
    for (const p of parqs) {
      if (p.supersedes_id && idMap.has(p.supersedes_id)) {
        await pool.query(
          `UPDATE client_documents SET supersedes_id = $1 WHERE id = $2`,
          [idMap.get(p.supersedes_id), idMap.get(p.id)]
        );
      }
    }

    // 7. Verification query: every signed_parq.id should have exactly one parq doc.
    const { rows: mismatch } = await pool.query(
      `SELECT COUNT(*)::int AS parq_rows,
              (SELECT COUNT(*)::int FROM client_documents WHERE kind = 'parq') AS doc_rows`
    );
    const { parq_rows, doc_rows } = mismatch[0];
    console.log(`VERIFY — signed_parq rows: ${parq_rows}, client_documents(parq) rows: ${doc_rows}`);
    if (parq_rows !== doc_rows) {
      console.warn("  !! MISMATCH — not all rows migrated. Investigate before retirement.");
    } else {
      console.log("  parity count OK (1:1). Spot-check >=3 real clients before retiring signed_parq.");
    }
  } finally {
    await pool.end();
  }
}

// main().catch((e) => { console.error(e.message); process.exit(1); });
//
// ^ Commented out on purpose: this script is delivered for review only and must
//   NOT execute this session. Uncomment and run only with Craig's per-session
//   go-ahead + open Coolify SSH tunnel.
console.log("SCRIPT DELIVERED FOR REVIEW ONLY — not executed this session.");
