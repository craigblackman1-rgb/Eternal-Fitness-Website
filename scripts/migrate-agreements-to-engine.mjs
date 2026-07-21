#!/usr/bin/env node
// Snapshot every existing signed_agreements row into client_documents
// (kind='terms') — the document engine's 'terms' template was already
// updated 2026-07-04 to BE the real, dual-signed Personal Training
// Agreement, so no new kind or template is needed, just the data.
//
// Unlike PAR-Q, the Agreement has no questionnaire content — it's pure
// legal text (the shared template body) plus a client + trainer signature.
// So there is no feedback_responses to populate here.
//
// IMPORTANT — deliberately NOT migrated: package_type, sessions_used/
// remaining, payment_status, medical_clearance_status, gp_letter_*,
// trainer_observations, risk_level, exercise_modifications, watch_for,
// referral_source, client_status. These columns exist on signed_agreements
// but are NOT what the live hub UI reads/writes for those concepts —
// PackagePaymentsCard and ClinicalComplianceCard (used on the real client
// detail page) write to the `clients` table via /api/clients/[id], a
// completely separate, unsynced path. That's a genuine pre-existing data
// duplication bug between signed_agreements and clients, not something to
// paper over by inventing document-engine columns for it. Flagged
// separately for Craig — not fixed as a side effect of this migration.
//
// No legacy signed_agreements row is touched/deleted here.
//
// Usage: node scripts/migrate-agreements-to-engine.mjs

import { readFileSync } from "fs";
import { Pool, types } from "pg";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

types.setTypeParser(1114, (v) => v);
types.setTypeParser(1184, (v) => v);
types.setTypeParser(1082, (v) => v);

const STATUS_MAP = {
  signed: "signed",
  draft: "draft",
  sent: "sent",
  received: "sent",
  expired: "draft",
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
      `SELECT id, version, body, requires_client_signature, requires_trainer_signature FROM document_templates WHERE kind = 'terms' AND is_active ORDER BY version DESC LIMIT 1`,
    );
    if (tplRows.length === 0) throw new Error("No active 'terms' document_templates row found.");
    const tpl = tplRows[0];

    const { rows: agreements } = await pool.query(`SELECT * FROM signed_agreements ORDER BY created_at ASC`);
    console.log(`Found ${agreements.length} signed_agreements rows to snapshot.`);

    let skipped = 0;
    for (const a of agreements) {
      let clientId = a.client_id;
      if (!clientId) {
        // A handful of legacy rows were never linked to a clients row (name
        // stored as free text only). Resolve by exact case-insensitive name
        // match; skip — never guess — if that doesn't resolve to exactly one row.
        const { rows: match } = await pool.query(`SELECT id FROM clients WHERE name ILIKE $1`, [a.client_name]);
        if (match.length !== 1) {
          console.warn(`  !! skipping ${a.client_name} (legacy ${a.id}) — client_id null and name resolved to ${match.length} clients rows, not 1`);
          skipped++;
          continue;
        }
        clientId = match[0].id;
      }
      const status = STATUS_MAP[a.status] ?? (a.client_signature_data || a.client_typed_signature ? "signed" : "draft");
      const clientSignature = a.client_typed_signature || a.client_name_print || a.client_name || null;
      const trainerSignature = a.trainer_typed_signature || a.trainer_name_print || a.trainer_name || null;
      const title = tpl.body?.name || "Personal Training Agreement";

      const { rows: inserted } = await pool.query(
        `INSERT INTO client_documents (
           client_id, kind, title, template_id, template_version, body,
           requires_client_signature, requires_trainer_signature, status, version,
           client_name, client_signature, client_signed_date,
           trainer_name, trainer_signature, trainer_signed_date,
           signed_at, sent_at, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         RETURNING id`,
        [
          clientId, "terms", "Personal Training Agreement", tpl.id, tpl.version, tpl.body,
          tpl.requires_client_signature, tpl.requires_trainer_signature, status, 1,
          a.client_name_print ?? a.client_name, clientSignature, a.client_signature_date ?? null,
          a.trainer_name_print ?? a.trainer_name, trainerSignature, a.trainer_signature_date ?? null,
          a.signed_at ?? null, a.sent_date ?? null, a.created_at ?? new Date().toISOString(), a.created_at ?? new Date().toISOString(),
        ],
      );
      console.log(`  snapshotted ${a.client_name} (legacy ${a.id} -> doc ${inserted[0].id}) status=${status}`);
    }

    const { rows: mismatch } = await pool.query(
      `SELECT COUNT(*)::int AS legacy_rows, (SELECT COUNT(*)::int FROM client_documents WHERE kind = 'terms' AND template_id = $1) AS doc_rows FROM signed_agreements`,
      [tpl.id],
    );
    console.log(`VERIFY — signed_agreements rows: ${mismatch[0].legacy_rows}, client_documents(terms, this template) rows: ${mismatch[0].doc_rows}, skipped: ${skipped}`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
