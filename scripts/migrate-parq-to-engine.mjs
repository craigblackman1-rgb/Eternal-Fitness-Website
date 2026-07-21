#!/usr/bin/env node
// Snapshot every existing signed_parq row into client_documents (kind='parq'),
// onto the document engine's real interactive feedbackSections/feedbackConsents
// schema (the same one the Client Feedback Questionnaire uses) — NOT the
// earlier raw-HTML-table body shape this script originally planned. That
// switch matters here specifically: it's what makes the migrated PAR-Q real
// typed/radio-group form fields a screen reader can operate, instead of a
// read-only HTML dump.
//
// No legacy signed_parq row is touched/deleted — retiring that table is a
// SEPARATE, later, gated step once parity is proven against real clients.
//
// Usage: node scripts/migrate-parq-to-engine.mjs
// Requires DATABASE_URL (reads .env.local if not already in the environment).

import { readFileSync } from "fs";
import { Pool, types } from "pg";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

types.setTypeParser(1114, (v) => v);
types.setTypeParser(1184, (v) => v);
types.setTypeParser(1082, (v) => v);

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

const STATUS_MAP = {
  signed: "signed",
  draft: "draft",
  superseded: "superseded",
  received: "sent",
  sent: "sent",
  expired: "draft",
  needs_update: "sent",
};

async function main() {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("DATABASE_URL not set");
  const pool = new Pool({
    connectionString: cs,
    ssl: cs && !/127\.0\.0\.1|localhost/.test(cs) ? { rejectUnauthorized: false } : false,
  });

  try {
    const { rows: tplRows } = await pool.query(
      `SELECT id, version, body FROM document_templates WHERE kind = 'parq' AND is_active ORDER BY version DESC LIMIT 1`,
    );
    if (tplRows.length === 0) {
      throw new Error("No active 'parq' document_templates row found. Run 20260721_seed_parq_template.sql first.");
    }
    const tpl = tplRows[0];

    const { rows: parqs } = await pool.query(`SELECT * FROM signed_parq ORDER BY created_at ASC, version ASC`);
    console.log(`Found ${parqs.length} signed_parq rows to snapshot.`);

    const idMap = new Map();

    for (const p of parqs) {
      const anyYes = QUESTION_KEYS.some((q) => p[q] === "yes");

      const answers = {};
      for (const k of PERSONAL_KEYS) answers[k] = p[k] ?? "";
      for (const q of QUESTION_KEYS) answers[q] = p[q] ?? "";
      for (const k of DETAIL_KEYS) answers[k] = p[k] ?? "";

      const status = STATUS_MAP[p.status] ?? "draft";
      // Never carry over a drawn-canvas signature blob into the new column —
      // it's just a giant base64 PNG and the engine only ever displays
      // client_signature as plain text. Typed name (or printed name) only.
      const clientSignature = p.client_typed_signature || p.client_name_print || p.full_name || null;
      const title = `${p.full_name} — PAR-Q`;

      const { rows: inserted } = await pool.query(
        `INSERT INTO client_documents (
           client_id, kind, title, template_id, template_version, body, feedback_responses,
           requires_client_signature, requires_trainer_signature, status, version,
           client_name, client_signature, client_signed_date,
           signed_at, sent_at, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id`,
        [
          p.client_id, "parq", title, tpl.id, tpl.version,
          tpl.body, JSON.stringify({ answers }),
          true, false, status, p.version ?? 1,
          p.client_name_print ?? p.full_name, clientSignature, p.client_signature_date ?? null,
          p.signed_at ?? null, p.sent_date ?? null, p.created_at ?? new Date().toISOString(), p.updated_at ?? new Date().toISOString(),
        ],
      );
      const newId = inserted[0].id;
      idMap.set(p.id, newId);

      // Preserve clearance side-effect (idempotent — re-derives what
      // import-parq.mjs / the live form already set).
      const clearanceStatus = anyYes ? "pending" : "not_required";
      const trackerStatus = anyYes ? "PENDING" : "NOT REQUIRED";
      const trackerRequired = anyYes ? "Y" : "N";
      if (p.client_id) {
        await pool.query(`UPDATE clients SET medical_clearance_status = $1 WHERE id = $2`, [clearanceStatus, p.client_id]);
        await pool.query(
          `UPDATE client_tracker SET clearance_status = $1, clearance_required = $2 WHERE client_id = $3`,
          [trackerStatus, trackerRequired, p.client_id],
        );
      }

      console.log(`  snapshotted ${p.full_name} (legacy ${p.id} -> doc ${newId}) anyYes=${anyYes}`);
    }

    // Re-point supersedes_id from legacy signed_parq.supersedes_id to new doc ids.
    for (const p of parqs) {
      if (p.supersedes_id && idMap.has(p.supersedes_id)) {
        await pool.query(`UPDATE client_documents SET supersedes_id = $1 WHERE id = $2`, [
          idMap.get(p.supersedes_id),
          idMap.get(p.id),
        ]);
      }
    }

    const { rows: mismatch } = await pool.query(
      `SELECT COUNT(*)::int AS parq_rows, (SELECT COUNT(*)::int FROM client_documents WHERE kind = 'parq') AS doc_rows FROM signed_parq`,
    );
    const { parq_rows, doc_rows } = mismatch[0];
    console.log(`VERIFY — signed_parq rows: ${parq_rows}, client_documents(parq) rows: ${doc_rows}`);
    if (parq_rows !== doc_rows) {
      console.warn("  !! MISMATCH — not all rows migrated. Investigate before relying on this.");
      process.exitCode = 1;
    } else {
      console.log("  parity count OK (1:1).");
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
