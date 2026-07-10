#!/usr/bin/env node
// Import a signed PAR-Q (ported from an MS Forms PDF export) for an existing client.
//
// Usage: node scripts/import-parq.mjs path/to/parq.json
// Reads DATABASE_URL from the environment — run against production via the
// Coolify SSH tunnel (see eternal-fitness/.context or infra memory for the
// tunnel command), or locally against a dev DB.
//
// Input JSON shape:
// {
//   "clientName": "Sarah Tyler",          // must match an existing clients.name exactly
//   "dateOfBirth": "1997-01-21",
//   "address": "14 The Plantation",
//   "email": "...", "phone": "...",
//   "emergencyContactName": "...", "emergencyContactPhone": "...",
//   "gpName": "...", "gpSurgery": "...", "gpPhone": "...",
//   "answers": { "q1": "no", "q2": "no", ..., "q29": "no" },   // q1-q29, "yes"|"no"
//   "conditions": "", "medications": "", "devices": "",
//   "exerciseRestrictions": "", "surgeries": "", "otherInfo": "",
//   "currentExercise": "...", "trainingGoals": "...",
//   "clientNamePrint": "...", "clientSignatureDate": "2026-05-29",
//   "clientTypedSignature": "..."
// }

import { Pool, types } from "pg";
import { readFileSync } from "fs";

types.setTypeParser(1114, (v) => v);
types.setTypeParser(1184, (v) => v);
types.setTypeParser(1082, (v) => v);

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-parq.mjs path/to/parq.json");
  process.exit(1);
}
const input = JSON.parse(readFileSync(file, "utf8"));

const cs = process.env.DATABASE_URL;
if (!cs) {
  console.error("DATABASE_URL is not set. Source the app's env (or open the DB tunnel) first.");
  process.exit(1);
}
const pool = new Pool({
  connectionString: cs,
  ssl: !/127\.0\.0\.1|localhost/.test(cs) ? { rejectUnauthorized: false } : false,
});

const QUESTION_KEYS = Array.from({ length: 29 }, (_, i) => `q${i + 1}`);

function requireAnswers(answers) {
  const missing = QUESTION_KEYS.filter((k) => answers[k] !== "yes" && answers[k] !== "no");
  if (missing.length) throw new Error(`Missing/invalid answers for: ${missing.join(", ")}`);
}

async function main() {
  requireAnswers(input.answers);

  const { rows: clientRows } = await pool.query(
    `SELECT id, name, client_number FROM clients WHERE name ILIKE $1`,
    [input.clientName]
  );
  if (clientRows.length === 0) {
    throw new Error(`No client found matching "${input.clientName}". Create the client record first.`);
  }
  if (clientRows.length > 1) {
    throw new Error(`Multiple clients match "${input.clientName}": ${clientRows.map((r) => r.client_number).join(", ")}. Disambiguate.`);
  }
  const client = clientRows[0];

  const anyYes = QUESTION_KEYS.some((k) => input.answers[k] === "yes");
  const yesQuestions = QUESTION_KEYS.filter((k) => input.answers[k] === "yes");

  const cols = [
    "client_id", "full_name", "date_of_birth", "address", "email", "phone",
    "emergency_contact_name", "emergency_contact_phone", "gp_name", "gp_surgery", "gp_phone",
    ...QUESTION_KEYS,
    "conditions", "medications", "devices", "exercise_restrictions", "surgeries", "other_info",
    "current_exercise", "training_goals",
    "client_name_print", "client_signature_date", "client_typed_signature", "status",
  ];
  const values = [
    client.id, input.clientName, input.dateOfBirth ?? null, input.address ?? null, input.email ?? null, input.phone ?? null,
    input.emergencyContactName ?? null, input.emergencyContactPhone ?? null, input.gpName ?? null, input.gpSurgery ?? null, input.gpPhone ?? null,
    ...QUESTION_KEYS.map((k) => input.answers[k]),
    input.conditions ?? "", input.medications ?? "", input.devices ?? "", input.exerciseRestrictions ?? "", input.surgeries ?? "", input.otherInfo ?? "",
    input.currentExercise ?? "", input.trainingGoals ?? "",
    input.clientNamePrint ?? input.clientName, input.clientSignatureDate ?? null, input.clientTypedSignature ?? input.clientName, "signed",
  ];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
  const { rows: inserted } = await pool.query(
    `INSERT INTO signed_parq (${cols.join(", ")}) VALUES (${placeholders}) RETURNING id, signed_at`,
    values
  );

  const clearanceStatus = anyYes ? "pending" : "not_required";
  const trackerStatus = anyYes ? "PENDING" : "NOT REQUIRED";
  const trackerRequired = anyYes ? "Y" : "N";

  await pool.query(`UPDATE clients SET medical_clearance_status = $1 WHERE id = $2`, [clearanceStatus, client.id]);
  await pool.query(
    `UPDATE client_tracker SET clearance_status = $1, clearance_required = $2 WHERE client_id = $3`,
    [trackerStatus, trackerRequired, client.id]
  );

  if (input.clientSignatureDate) {
    const reviewDate = new Date(input.clientSignatureDate);
    reviewDate.setFullYear(reviewDate.getFullYear() + 1);
    await pool.query(`UPDATE clients SET annual_review_due_date = $1 WHERE id = $2`, [
      reviewDate.toISOString().slice(0, 10),
      client.id,
    ]);
  }

  console.log(`Imported PAR-Q for ${input.clientName} (client #${client.client_number}) — signed_parq id ${inserted[0].id}`);
  if (anyYes) {
    console.log(`FLAGGED: YES answers on ${yesQuestions.join(", ")} — clearance set to PENDING, needs review before training.`);
  } else {
    console.log("Clean form — no YES answers. Clearance set to not_required.");
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
