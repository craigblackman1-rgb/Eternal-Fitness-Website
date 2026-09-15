import type { DBBlock } from "@/types";

/* ── buildNeedsYouItems — pure data builder, shared between desktop and PWA.
   Extracted from NeedsYouQueue.tsx so server-side helpers can call it
   without importing a "use client" file. */

export interface NeedsYouInput {
  pendingTaskCount: number;
  draftBlockCount: number;
  undatedSessionCount: number;
  blockSessionCountMismatch: boolean;
  unpaidBlocks: string[];
  draftInvoice?: { id: string; invoice_number: string | null } | null;
  missingBandSet: boolean;
  outstandingActions: string[];
  autoOutstanding: string[];
  effectiveStatus: string;
  dueInfo: { nextDueDate: string | null; daysUntilDue: number | null; status: string | null };
  hasAllDocsSigned: boolean;
  healthFlagsCount: number;
  trainingRulesCount: number;
  clientNumber: number;
  latestBlock: DBBlock | null;
  isHomeTraining?: boolean;
  goneQuiet?: boolean;
  lastClientLogAt?: string | null;
  quietDays?: number;
  packageUnderSpecified?: boolean;
  openBookingCount?: number;
  oldestOpenBooking?: string | null;
  missingPackageTerms?: string[];
  clientFirstName?: string;
  sessionsRemaining?: number | null;
  sessionsPurchased?: number | null;
  paymentStatus?: string;
  blockExpiryDate?: string | null;
  onRenewal?: () => void;
}

export interface QueueItem {
  id: string;
  dot: "warn" | "due" | "ok" | "muted";
  headline: string;
  subline?: string;
  actionLabel?: string;
  actionDrawerId?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function buildNeedsYouItems(input: NeedsYouInput): QueueItem[] {
  const {
    pendingTaskCount,
    draftBlockCount,
    undatedSessionCount,
    blockSessionCountMismatch,
    unpaidBlocks,
    draftInvoice,
    missingBandSet,
    outstandingActions,
    autoOutstanding,
    clientNumber,
    latestBlock,
    isHomeTraining,
    goneQuiet,
    lastClientLogAt,
    quietDays,
    packageUnderSpecified,
    missingPackageTerms,
    openBookingCount,
    oldestOpenBooking,
    clientFirstName,
    sessionsRemaining,
    sessionsPurchased,
    paymentStatus,
    blockExpiryDate,
    onRenewal,
  } = input;
  const items: QueueItem[] = [];

  if (isHomeTraining && goneQuiet) {
    const name = clientFirstName || "This client";
    items.push({
      id: "gone-quiet",
      dot: "due",
      headline: lastClientLogAt
        ? `${name} has not logged a set in over ${quietDays ?? 7} days`
        : `${name} has never logged a set`,
      subline: lastClientLogAt
        ? `Last self-logged set ${new Date(lastClientLogAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. Home training is self-logged, so silence is the only signal.`
        : "Home training is self-logged, so nothing has come through the portal at all.",
      actionLabel: "Write an update",
      actionHref: `/hub/clients/${clientNumber}/comms/new`,
    });
  }

  if ((openBookingCount ?? 0) > 0) {
    const n = openBookingCount!;
    items.push({
      id: "outlook-bookings",
      dot: "warn",
      headline: `${n} unconfirmed booking${n === 1 ? "" : "s"} waiting to be sorted`,
      subline: oldestOpenBooking
        ? `Oldest ${new Date(oldestOpenBooking).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. Until they are confirmed the block reads fewer sessions done than really happened.`
        : "Until they are confirmed the block reads fewer sessions done than really happened.",
      actionLabel: "Sort in triage",
      actionHref: `/hub/schedule/triage?client=${clientNumber}`,
    });
  }

  if (pendingTaskCount > 0) {
    items.push({
      id: "tasks",
      dot: "warn",
      headline: `${pendingTaskCount} open task${pendingTaskCount === 1 ? "" : "s"}`,
      actionLabel: "Open tasks",
      actionHref: `/hub/clients/${clientNumber}/edit#sec-compliance`,
    });
  }

  if (draftBlockCount > 0) {
    items.push({
      id: "draft-blocks",
      dot: "warn",
      headline: `${draftBlockCount} block${draftBlockCount === 1 ? "" : "s"} still draft`,
      subline: "Cannot run until approved",
      actionLabel: "Review",
      actionDrawerId: "dw-training",
    });
  }

  if (undatedSessionCount > 0) {
    items.push({
      id: "undated-sessions",
      dot: "warn",
      headline: `${undatedSessionCount} session${undatedSessionCount === 1 ? "" : "s"} with no date set`,
      actionLabel: "Set dates",
      actionDrawerId: "dw-training",
    });
  }

  if (blockSessionCountMismatch) {
    items.push({
      id: "count-mismatch",
      dot: "warn",
      headline: "Session counts disagree",
      subline: "The typed count doesn't match what's been completed",
      actionLabel: "Check",
      actionHref: `/hub/clients/${clientNumber}/edit#sec-logistics`,
    });
  }

  if (paymentStatus && paymentStatus !== "paid") {
    const sessionsLow =
      sessionsPurchased != null &&
      sessionsRemaining != null &&
      sessionsRemaining <= 1;
    let expirySoon = false;
    if (blockExpiryDate) {
      const daysUntilExpiry = Math.ceil(
        (new Date(blockExpiryDate).getTime() - Date.now()) / 86_400_000,
      );
      expirySoon = daysUntilExpiry <= 14;
    }
    if (sessionsLow || expirySoon) {
      const reason =
        sessionsLow && expirySoon
          ? "sessions are nearly used up and the block is expiring soon"
          : sessionsLow
            ? "sessions are nearly used up"
            : "the block is expiring soon";
      items.push({
        id: "renewal-due",
        dot: "due",
        headline: `Renewal due \u2014 ${reason}`,
        subline:
          paymentStatus === "pending"
            ? "Payment is pending."
            : paymentStatus === "overdue"
              ? "Payment is overdue."
              : undefined,
        actionLabel: "Start next package",
        onAction: onRenewal,
      });
    }
  }

  if (unpaidBlocks.length > 0) {
    items.push({
      id: "unpaid",
      dot: "due",
      headline: `${unpaidBlocks[0]} is unpaid`,
      subline:
        unpaidBlocks.length > 1
          ? `${unpaidBlocks.length - 1} more unpaid`
          : undefined,
      actionLabel: draftInvoice
        ? "Continue draft invoice"
        : "Raise invoice",
      actionHref: draftInvoice
        ? `/hub/cashflow/invoices/${draftInvoice.id}`
        : "/hub/cashflow/invoices",
    });
  }

  if (missingBandSet) {
    items.push({
      id: "band-set",
      dot: "muted",
      headline: "No band set chosen",
      actionLabel: "Choose one",
      actionHref: `/hub/clients/${clientNumber}/edit#sec-logistics`,
    });
  }

  if (autoOutstanding.length > 0) {
    for (const action of autoOutstanding) {
      items.push({
        id: `auto-${action.slice(0, 30)}`,
        dot: "warn",
        headline: action,
      });
    }
  }

  if (outstandingActions.length > 0) {
    for (const action of outstandingActions) {
      items.push({
        id: `manual-${action.slice(0, 30)}`,
        dot: "warn",
        headline: action,
      });
    }
  }

  if (packageUnderSpecified) {
    const missing = missingPackageTerms ?? [];
    const missingLabel =
      missing.length === 2
        ? "rate or expiry"
        : missing.length === 1
          ? `${missing[0]}`
          : "terms";
    items.push({
      id: "package-underspecified",
      dot: "muted",
      headline: `The package has no ${missingLabel} set`,
      subline:
        "It is named, but nothing can be invoiced or chased against it.",
      actionLabel: "Set it up",
      actionHref: `/hub/clients/${clientNumber}/edit#sec-logistics`,
    });
  }

  return items;
}
