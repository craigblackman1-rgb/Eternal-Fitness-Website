// CR-EF-148: Backfill emergency contact from signed PAR-Qs into client profiles.
//
// DRY RUN by default — prints what would be written for each client.
// Pass --apply to actually write the emergency contact into client profiles.
//
// Usage:
//   node scripts/backfill-emergency-contacts-from-parq.mjs          # dry run
//   node scripts/backfill-emergency-contacts-from-parq.mjs --apply   # write changes
//
// Requires DATABASE_URL in the environment (same pattern as other scripts).
import { fileURLToPath } from "node:url";
import pg from "pg";

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (!isMain) {
  console.log("Guarded: run this directly with `node scripts/backfill-emergency-contacts-from-parq.mjs`.");
  process.exit(0);
}

const APPLY = process.argv.includes("--apply");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Export it before running this script.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Find all signed PAR-Qs with non-empty emergency contact fields.
  // Two sources: client_documents (document engine) and signed_parq (legacy).
  const { rows: docParqs } = await client.query(`
    SELECT
      cd.id AS doc_id,
      cd.client_id,
      'document_engine' AS source,
      cd.feedback_responses -> 'answers' ->> 'emergency_contact_name' AS ec_name,
      cd.feedback_responses -> 'answers' ->> 'emergency_contact_phone' AS ec_phone
    FROM client_documents cd
    WHERE cd.kind = 'parq'
      AND cd.status = 'signed'
      AND (
        (cd.feedback_responses -> 'answers' ->> 'emergency_contact_name' IS NOT NULL AND trim(cd.feedback_responses -> 'answers' ->> 'emergency_contact_name') <> '')
        OR
        (cd.feedback_responses -> 'answers' ->> 'emergency_contact_phone' IS NOT NULL AND trim(cd.feedback_responses -> 'answers' ->> 'emergency_contact_phone') <> '')
      )
  `);

  const { rows: legacyParqs } = await client.query(`
    SELECT
      sp.id AS doc_id,
      sp.client_id,
      'signed_parq' AS source,
      sp.emergency_contact_name AS ec_name,
      sp.emergency_contact_phone AS ec_phone
    FROM signed_parq sp
    WHERE sp.status = 'signed'
      AND sp.client_id IS NOT NULL
      AND (
        (sp.emergency_contact_name IS NOT NULL AND trim(sp.emergency_contact_name) <> '')
        OR
        (sp.emergency_contact_phone IS NOT NULL AND trim(sp.emergency_contact_phone) <> '')
      )
  `);

  // Deduplicate by client_id — prefer the most recent PAR-Q per client.
  const all = [...docParqs, ...legacyParqs];
  const byClient = new Map();
  for (const row of all) {
    const existing = byClient.get(row.client_id);
    if (!existing) {
      byClient.set(row.client_id, row);
    }
  }

  console.log(`Found ${byClient.size} client(s) with non-empty emergency contact in a signed PAR-Q.\n`);

  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const [clientId, parq] of byClient) {
    const name = parq.ec_name?.trim() || null;
    const phone = parq.ec_phone?.trim() || null;

    if (!name && !phone) {
      console.log(`  [${clientId}] PAR-Q ${parq.doc_id}: both fields empty after trim — skipping.`);
      totalSkipped++;
      continue;
    }

    // Read the client's current profile.
    const { rows: clientRows } = await client.query(
      "SELECT profile FROM clients WHERE id = $1",
      [clientId],
    );

    if (clientRows.length === 0) {
      console.log(`  [${clientId}] PAR-Q ${parq.doc_id}: client not found — skipping.`);
      totalSkipped++;
      continue;
    }

    const profile = clientRows[0].profile || {};
    const existing = profile.emergency_contact || null;

    // Don't overwrite a manually-entered entry that already has data.
    // Only write if the profile has no emergency contact or it's empty.
    if (existing && (existing.name || existing.phone)) {
      console.log(
        `  [${clientId}] PAR-Q ${parq.doc_id}: ` +
        `client already has emergency contact (${existing.name || "—"}, ${existing.phone || "—"}) — skipping.`,
      );
      totalSkipped++;
      continue;
    }

    const merged = {
      name,
      relationship: existing?.relationship || null,
      phone,
      source: "from PAR-Q",
    };

    console.log(
      `  [${clientId}] PAR-Q ${parq.doc_id}: ` +
      `would set emergency contact to ${name || "—"} (${phone || "—"}).`,
    );

    if (APPLY) {
      profile.emergency_contact = merged;
      await client.query(
        "UPDATE clients SET profile = $1 WHERE id = $2",
        [JSON.stringify(profile), clientId],
      );
      console.log(`    -> Applied.`);
    }

    totalUpdated++;
  }

  console.log(
    `\nDone. ${totalUpdated} client(s) would be updated.` +
    (APPLY ? "" : " Run with --apply to write changes."),
  );

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
