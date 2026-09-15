import { getPool } from "@/lib/pg-client";
import { computeComplianceFlags } from "@/lib/compliance";
import { computeUpdateDue } from "@/lib/updates-due";
import { isGoneQuiet, HOME_TRAINING_QUIET_DAYS } from "@/lib/progress";
import { getLastClientLogAt } from "@/lib/progress-db";
import { deriveBlockStatus } from "@/lib/block-status";
import { buildNeedsYouItems, type NeedsYouInput } from "@/lib/hub/build-needs-you";
import type { DBBlock } from "@/types";

/**
 * Derive the "Needs you" queue for a single client. Shared between the
 * desktop client record page and the PWA client detail page so both
 * surfaces always show the same items.
 *
 * Returns the queue items (from buildNeedsYouItems) plus the raw
 * NeedsYouInput so the caller can render the header count directly.
 */
export async function getClientNeeds(
  clientId: string,
  clientNumber: number,
): Promise<{ items: ReturnType<typeof buildNeedsYouItems>; input: NeedsYouInput }> {
  const pool = getPool();

  const { rows: clientRows } = await pool.query(
    `SELECT id, client_number, name, compliance_status, outstanding_actions,
            medical_clearance_status, gp_letter_status, risk_level,
            payment_status, sessions_purchased, sessions_used, pot_baseline_used,
            block_expiry_date, delivery_mode, client_rate, package_type,
            update_interval, update_interval_weeks, update_interval_next_date,
            active_program_id, profile
       FROM clients
      WHERE id = $1`,
    [clientId],
  );
  const client = clientRows[0];
  if (!client) throw new Error(`Client ${clientId} not found`);

  const { rows: blocks } = await pool.query(
    `SELECT * FROM blocks WHERE client_id = $1 ORDER BY block_number DESC`,
    [clientId],
  );

  const blockIds = blocks.map((b: any) => b.id);

  const { rows: allSessions } = blockIds.length > 0
    ? await pool.query(
        `SELECT id, block_id, session_number, status, completed_at, scheduled_at,
                cancelled_at, charged_free, parent_session_id, data
           FROM sessions
          WHERE block_id = ANY($1)`,
        [blockIds],
      )
    : { rows: [] as any[] };

  // Derive block status from sessions
  const derivedStatusByBlock = new Map<string, string>();
  for (const block of blocks) {
    const blockSessions = allSessions.filter((s: any) => s.block_id === block.id);
    derivedStatusByBlock.set(block.id, deriveBlockStatus(block.status, blockSessions));
  }

  const latestBlock: DBBlock | null = blocks.length > 0
    ? (blocks.find((b: any) => derivedStatusByBlock.get(b.id) === "active")
        ?? blocks.find((b: any) => b.status === "approved")
        ?? blocks[0])
    : null;

  // Tasks
  const { rows: taskRows } = await pool.query(
    `SELECT status FROM tasks WHERE client_id = $1`,
    [clientId],
  );
  const pendingTaskCount = taskRows.filter((t: any) => t.status !== "done").length;

  // Draft blocks
  const draftBlockCount = blocks.filter((b: any) => b.status === "draft").length;

  // Undated sessions in latest block
  const latestBlockSessions = latestBlock
    ? allSessions.filter((s: any) => s.block_id === latestBlock.id && !s.parent_session_id)
    : [];
  const undatedSessionCount = latestBlockSessions.filter((s: any) => !s.scheduled_at).length;

  // Block session count mismatch
  const baselineUsed = client.pot_baseline_used ?? 0;
  let hubUsedCount = 0;
  for (const s of allSessions) {
    if (s.status === "completed" || (s.status === "cancelled" && s.charged_free !== "free")) {
      hubUsedCount++;
    }
  }
  const blockSessionCountMismatch =
    client.sessions_used != null && client.sessions_used !== baselineUsed + hubUsedCount;

  // Unpaid blocks
  const unpaidBlocks =
    client.payment_status !== "paid" && latestBlock
      ? [`Block ${latestBlock.block_number}`]
      : [];

  // Draft invoice
  const { rows: draftInvoiceRows } = await pool.query(
    `SELECT id, invoice_number FROM invoices
      WHERE client_id = $1 AND status = 'draft' LIMIT 1`,
    [clientId],
  );
  const draftInvoice = draftInvoiceRows[0] ?? null;

  // Missing band set
  const missingBandSet =
    (latestBlock as any)?.group_type === "band" && !client.band_set_id;

  // Compliance flags
  const { rows: parqs } = await pool.query(
    `SELECT * FROM signed_parq WHERE client_id = $1 ORDER BY created_at DESC`,
    [clientId],
  );
  const { rows: agreements } = await pool.query(
    `SELECT * FROM signed_agreements WHERE client_id = $1 ORDER BY created_at DESC`,
    [clientId],
  );
  const { rows: clientDocuments } = await pool.query(
    `SELECT id, kind, status FROM client_documents WHERE client_id = $1`,
    [clientId],
  );

  const latestParq = parqs[0] ?? null;
  const latestAgreement = agreements[0] ?? null;
  const hasSignedParqDocument = clientDocuments.some(
    (d: any) => d.kind === "parq" && d.status === "signed",
  );
  const hasSignedAgreementDocument = clientDocuments.some(
    (d: any) => d.kind === "terms" && d.status === "signed",
  );

  const flags = computeComplianceFlags({
    client,
    latestParq,
    latestAgreement,
    hasSignedParqDocument,
    hasSignedAgreementDocument,
  });

  const autoOutstanding = flags.autoOutstanding;
  const outstandingActions = client.outstanding_actions ?? [];
  const effectiveStatus = flags.effectiveStatus;

  // Update due
  const { rows: updateRows } = await pool.query(
    `SELECT sent_at FROM sent_updates
      WHERE client_id = $1 AND status = 'sent'
      ORDER BY sent_at DESC LIMIT 1`,
    [clientId],
  );
  const lastSentAt = updateRows[0]?.sent_at ?? null;
  const dueInfo = computeUpdateDue(
    client.update_interval ?? null,
    lastSentAt,
    {
      weeks: client.update_interval_weeks ?? null,
      fixedDate: client.update_interval_next_date ?? null,
    },
  );

  // Has all docs signed
  const hasAllDocsSigned =
    effectiveStatus === "clear" ||
    (autoOutstanding.length === 0 && outstandingActions.length === 0);

  // Health flags
  const p = client.profile;
  const healthFlagsCount = (() => {
    if (!p?.health) return 0;
    let count = 0;
    if (p.health.conditions?.length > 0) count++;
    if (p.health.medications?.length > 0) count++;
    if (p.health.pain_points?.length > 0) count++;
    if (p.health.contraindications?.length > 0) count++;
    return count;
  })();

  // Training rules count
  const trainingRulesCount = p?.programming_adaptations?.length ?? 0;

  // Home training gone quiet
  const isHomeTraining = client.delivery_mode === "home_training";
  const lastClientLogAt = isHomeTraining ? await getLastClientLogAt(clientId) : null;
  const goneQuiet = isHomeTraining && isGoneQuiet(lastClientLogAt);

  // Open Outlook bookings
  const { rows: openBookingRows } = await pool.query(
    `SELECT id, start_at FROM outlook_booking_events
      WHERE client_id = $1 AND status = 'open'`,
    [clientId],
  );
  const openBookingCount = openBookingRows.length;
  const oldestOpenBooking = openBookingCount > 0
    ? openBookingRows
        .map((b: any) => b.start_at)
        .filter(Boolean)
        .sort()[0] ?? null
    : null;

  // Package under-specified
  const missingPackageTerms = [
    client.client_rate == null ? "rate" : null,
    client.block_expiry_date == null ? "expiry" : null,
  ].filter((x): x is string => x !== null);
  const packageUnderSpecified =
    Boolean(client.package_type) && missingPackageTerms.length > 0;

  // Sessions remaining (derived)
  const potBaselineUsed = client.pot_baseline_used ?? 0;
  let potUsedCount = 0;
  for (const s of allSessions) {
    if (s.status === "completed" || (s.status === "cancelled" && s.charged_free !== "free")) {
      potUsedCount++;
    }
  }
  const sessionsRemaining =
    client.sessions_purchased != null
      ? Math.max(0, client.sessions_purchased - potBaselineUsed - potUsedCount)
      : null;

  const input: NeedsYouInput = {
    pendingTaskCount,
    draftBlockCount,
    undatedSessionCount,
    blockSessionCountMismatch,
    unpaidBlocks,
    draftInvoice,
    missingBandSet,
    outstandingActions,
    autoOutstanding,
    effectiveStatus,
    dueInfo,
    hasAllDocsSigned,
    healthFlagsCount,
    trainingRulesCount,
    clientNumber,
    latestBlock,
    isHomeTraining,
    goneQuiet,
    lastClientLogAt,
    quietDays: HOME_TRAINING_QUIET_DAYS,
    packageUnderSpecified,
    openBookingCount,
    oldestOpenBooking,
    missingPackageTerms,
    clientFirstName: client.name?.split(" ")[0] ?? "",
    sessionsRemaining,
    sessionsPurchased: client.sessions_purchased ?? null,
    paymentStatus: client.payment_status,
    blockExpiryDate: client.block_expiry_date,
  };

  const items = buildNeedsYouItems(input);
  return { items, input };
}
