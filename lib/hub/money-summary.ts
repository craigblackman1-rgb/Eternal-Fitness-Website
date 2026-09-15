import { getPool } from "@/lib/pg-client";
import { deriveSessionPot } from "@/lib/session-pot";
import {
  findSuggestedMatches,
  type MatchTransaction,
  type MatchInvoice,
} from "@/lib/cashflow-matching";

export interface MoneyActionItem {
  id: string;
  tone: "due" | "warn" | "quiet";
  headline: string;
  subline: string;
  actionLabel: string;
  href: string;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

// A block within this many days of its expiry (or already past it) with
// sessions still unused is a "sell the next one now, or let it lapse"
// decision. 14 days = roughly two weeks' notice.
const BLOCK_ENDING_WINDOW_DAYS = 14;

// The standard session length. clients.session_duration defaults to 60;
// a client trained at any other length with no client_rate override means
// every invoice for them defaults to the wrong price (CR-EF-135).
const STANDARD_SESSION_DURATION = 60;

/**
 * Derive the money summary KPIs and action queue for the finance screens.
 * Shared between the desktop cashflow page and the PWA money page so both
 * surfaces always show the same numbers.
 */
export async function getMoneySummary(now: Date = new Date()): Promise<{
  collected: number;
  outstanding: number;
  overdue: number;
  invoiced: number;
  actionQueue: MoneyActionItem[];
  draftCount: number;
}> {
  const pool = getPool();
  const today = now.toISOString().slice(0, 10);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [clientsRes, invoicesRes, unmatchedTxnRes, dismissedRes] =
    await Promise.all([
      pool
        .query(
          `SELECT id, name, client_number, client_status, block_expiry_date,
                  sessions_remaining, sessions_purchased, pot_baseline_used,
                  client_rate, session_duration
             FROM clients
            WHERE client_status = 'active'`,
        )
        .then((r) => r.rows),
      pool
        .query(
          `SELECT i.id, i.invoice_number, i.status, i.total, i.issue_date,
                  i.due_date, i.updated_at, i.created_at, i.client_id,
                  c.name AS client_name, c.client_number
             FROM invoices i
             LEFT JOIN clients c ON c.id = i.client_id
            ORDER BY i.updated_at DESC`,
        )
        .then((r) => r.rows),
      pool
        .query(
          `SELECT * FROM bank_transactions WHERE matched_invoice_id IS NULL`,
        )
        .then((r) => r.rows),
      pool
        .query(
          `SELECT bank_transaction_id, invoice_id FROM dismissed_matches`,
        )
        .then((r) => r.rows),
    ]);

  // Also fetch confirmed bank matches for overdue unmatched check
  const matchedInvoiceRes = await pool
    .query(
      `SELECT matched_invoice_id FROM bank_transactions
        WHERE matched_invoice_id IS NOT NULL`,
    )
    .then((r) => r.rows);
  const confirmedMatchedIds = new Set(
    matchedInvoiceRes.map((r: any) => r.matched_invoice_id),
  );

  // Fetch candidate invoices for findSuggestedMatches recon check
  const candidateInvoicesRes = await pool
    .query(
      `SELECT i.id, i.client_id, i.invoice_number, i.issue_date, i.due_date,
              i.status, i.currency, i.subtotal, i.vat_total, i.total,
              i.client_document_id, i.notes, i.created_at, i.updated_at,
              c.name AS client_name, c.client_number
         FROM invoices i
         LEFT JOIN clients c ON c.id = i.client_id
        WHERE i.status IN ('sent', 'overdue')`,
    )
    .then((r) => r.rows);

  // Derive remaining sessions per active client for the "block ending soon" check
  const allClientIds = clientsRes.map((c: any) => c.id);
  const derivedRemainingByClientId = new Map<string, number | null>();
  if (allClientIds.length > 0) {
    const { rows: allClientBlocks } = await pool.query(
      `SELECT id, client_id FROM blocks WHERE client_id = ANY($1)`,
      [allClientIds],
    );
    const allBlockIds = allClientBlocks.map((b: any) => b.id);
    const blockToClientId = new Map<string, string>();
    for (const b of allClientBlocks) blockToClientId.set(b.id, b.client_id);

    if (allBlockIds.length > 0) {
      const { rows: allClientSessions } = await pool.query(
        `SELECT status, charged_free, cancelled_at, completed_at,
                parent_session_id, scheduled_at, data, block_id
           FROM sessions
          WHERE block_id = ANY($1)`,
        [allBlockIds],
      );
      const sessionsByClientId = new Map<string, any[]>();
      for (const s of allClientSessions) {
        const cid = blockToClientId.get(s.block_id);
        if (cid) {
          if (!sessionsByClientId.has(cid)) sessionsByClientId.set(cid, []);
          sessionsByClientId.get(cid)!.push(s);
        }
      }
      for (const c of clientsRes) {
        const cSessions = sessionsByClientId.get(c.id);
        if (cSessions && cSessions.length > 0) {
          const pot = deriveSessionPot(
            cSessions,
            c.sessions_purchased ?? null,
            c.pot_baseline_used ?? 0,
          );
          derivedRemainingByClientId.set(c.id, pot.remaining);
        } else {
          derivedRemainingByClientId.set(c.id, null);
        }
      }
    }
  }

  const allInvoices = invoicesRes;
  const allClients = clientsRes;

  // KPIs
  const invoiced = allInvoices
    .filter(
      (inv: any) =>
        inv.issue_date >= thisMonthStart && inv.status !== "void",
    )
    .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
  const collected = allInvoices
    .filter(
      (inv: any) =>
        inv.status === "paid" && inv.issue_date >= thisMonthStart,
    )
    .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
  const outstanding = allInvoices
    .filter(
      (inv: any) =>
        inv.status === "sent" && inv.issue_date >= thisMonthStart,
    )
    .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
  const overdue = allInvoices
    .filter(
      (inv: any) =>
        inv.status === "overdue" ||
        (inv.status === "sent" && inv.due_date < today),
    )
    .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);

  const draftCount = allInvoices.filter(
    (inv: any) => inv.status === "draft",
  ).length;

  // ── Build action queue (same logic as desktop cashflow page) ──────
  const queue: MoneyActionItem[] = [];

  // 1) A block ending (or already ended) with sessions left unused — sell
  // the next one now, or let it lapse.
  const endingClients = clientsRes
    .filter((c: any) => {
      if (!c.block_expiry_date) return false;
      const remaining = derivedRemainingByClientId.get(c.id) ?? 0;
      if (remaining <= 0) return false;
      const expiry = new Date(c.block_expiry_date);
      const daysUntil = daysBetween(expiry, now);
      return daysUntil <= BLOCK_ENDING_WINDOW_DAYS;
    })
    .sort((a: any, b: any) => new Date(a.block_expiry_date).getTime() - new Date(b.block_expiry_date).getTime());

  for (const c of endingClients) {
    const expiry = new Date(c.block_expiry_date);
    const daysUntil = daysBetween(expiry, now);
    const remaining = derivedRemainingByClientId.get(c.id) ?? 0;
    const purchased = c.sessions_purchased ?? remaining;
    const whenText =
      daysUntil >= 0
        ? `ends in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`
        : `ended ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} ago`;
    queue.push({
      id: `block-${c.id}`,
      tone: "due",
      headline: `${c.name}'s program ${whenText}`,
      subline: `${remaining} of ${purchased} session${purchased === 1 ? "" : "s"} unused. Decide whether to sell the next program now.`,
      actionLabel: "Raise invoice",
      href: "/hub/cashflow/invoices/new",
    });
  }

  // 2) Draft invoices
  const draftInvoices = allInvoices.filter(
    (inv: any) => inv.status === "draft",
  );
  for (const inv of draftInvoices) {
    const ageDays = daysBetween(now, new Date(inv.issue_date));
    queue.push({
      id: `draft-${inv.id}`,
      tone: "warn",
      headline: `${inv.client_name ?? "Unknown client"}'s invoice (${fmt(Number(inv.total))}) has been a draft for ${ageDays} day${ageDays === 1 ? "" : "s"}`,
      subline:
        "A draft cannot be paid by any route until it's sent.",
      actionLabel: "Send invoice",
      href: `/hub/cashflow/invoices/${inv.id}`,
    });
  }

  // 3) Overdue invoices with no matching bank line
  const overdueUnmatched = allInvoices.filter(
    (inv: any) =>
      (inv.status === "overdue" ||
        (inv.status === "sent" && inv.due_date < today)) &&
      !confirmedMatchedIds.has(inv.id),
  );
  for (const inv of overdueUnmatched) {
    const daysOverdue = daysBetween(now, new Date(inv.due_date));
    queue.push({
      id: `overdue-${inv.id}`,
      tone: "warn",
      headline: `${inv.client_name ?? "Unknown client"}'s invoice (${fmt(Number(inv.total))}) is ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} past due, and no bank line has matched it`,
      subline:
        "If they've already paid another way, mark it \u2014 otherwise send a reminder.",
      actionLabel: "Open invoice",
      href: `/hub/cashflow/invoices/${inv.id}`,
    });
  }

  // 4) Bank lines that look like they match unpaid invoices — use the
  // findSuggestedMatches heuristic (same as desktop cashflow page)
  const dismissedSet = new Set(
    dismissedRes.map(
      (d: any) => `${d.bank_transaction_id}::${d.invoice_id}`,
    ),
  );
  const unmatchedTxns = unmatchedTxnRes.filter(
    (txn: any) =>
      !dismissedSet.has(`${txn.id}::null`) &&
      !dismissedSet.has(`${txn.id}::`),
  );
  const suggestionPairs = findSuggestedMatches({
    transactions: unmatchedTxns as MatchTransaction[],
    invoices: candidateInvoicesRes as (MatchInvoice & {
      clients: { name: string; client_number: number; display_code: string } | null;
    })[],
    dismissedSet,
  });
  if (suggestionPairs.length > 0) {
    const n = suggestionPairs.length;
    queue.push({
      id: "recon",
      tone: "quiet",
      headline: `${n} bank line${n === 1 ? "" : "s"} look${n === 1 ? "s" : ""} like ${n === 1 ? "it matches" : "they match"} unpaid invoices`,
      subline:
        "Reviewing a suggested match takes less time than chasing something already paid.",
      actionLabel: "Review matches",
      href: "/hub/cashflow/reconciliation",
    });
  }

  // 5) Clients with no rate set (non-standard duration)
  const noRateClients = allClients.filter(
    (c: any) =>
      c.client_rate == null &&
      c.session_duration != null &&
      c.session_duration !== STANDARD_SESSION_DURATION,
  );
  for (const c of noRateClients) {
    queue.push({
      id: `rate-${c.id}`,
      tone: "quiet",
      headline: `${c.name} has no rate set`,
      subline: `Trains in ${c.session_duration}-minute sessions, not the standard ${STANDARD_SESSION_DURATION}, but has no rate set \u2014 so every invoice falls back to the standard rate.`,
      actionLabel: "Set rate",
      href: `/hub/clients/${c.client_number}`,
    });
  }

  return {
    collected,
    outstanding,
    overdue,
    invoiced,
    actionQueue: queue,
    draftCount,
  };
}
