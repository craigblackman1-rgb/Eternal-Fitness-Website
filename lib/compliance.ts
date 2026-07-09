import type { DBClient, DBClientComplianceStatus, SignedAgreement, SignedPARQ } from "@/types";

/**
 * PAR-Q questions that, answered "yes", mean GP clearance is required before training.
 * Cardiac history/symptoms (q1,q2,q4,q7,q9), implanted devices (q14), spinal restriction (q15),
 * anticoagulants (q19), doctor-advised exercise restriction (q25). Esther should sign off on this
 * list — it's a clinical judgement call, not a technical one.
 */
const HIGH_RISK_PARQ_QUESTIONS = ["q1", "q2", "q4", "q7", "q9", "q14", "q15", "q19", "q25"] as const;

export interface ComplianceFlags {
  requiresGpClearance: boolean;
  autoOutstanding: string[];
  effectiveStatus: DBClientComplianceStatus;
}

export function computeComplianceFlags({
  client,
  latestParq,
  latestAgreement,
}: {
  client: Pick<DBClient, "compliance_status" | "profile" | "gp_letter_status" | "annual_review_due_date">;
  latestParq: SignedPARQ | null;
  latestAgreement: SignedAgreement | null;
}): ComplianceFlags {
  const requiresGpClearance = !!latestParq && HIGH_RISK_PARQ_QUESTIONS.some((q) => latestParq[q] === "yes");
  const gpClearanceObtained = !!client.profile?.health?.gp_clearance;
  const parqTrainerOverride = !!client.profile?.health?.parq_trainer_override;

  const autoOutstanding: string[] = [];
  if (!latestParq && !parqTrainerOverride) autoOutstanding.push("No PAR-Q on file");
  if (!latestParq && parqTrainerOverride) autoOutstanding.push("PAR-Q trainer-overridden — pending migration from Microsoft Forms");
  if (!latestAgreement || latestAgreement.status !== "signed") autoOutstanding.push("No signed agreement on file");
  if (requiresGpClearance && !gpClearanceObtained) autoOutstanding.push("GP clearance required — not yet obtained");
  if (client.gp_letter_status === "requested") autoOutstanding.push("GP letter requested — awaiting return");
  if (client.annual_review_due_date && new Date(client.annual_review_due_date) < new Date()) {
    autoOutstanding.push("Annual medical review is overdue");
  }

  let effectiveStatus: DBClientComplianceStatus;
  if (client.compliance_status === "do_not_train") {
    effectiveStatus = "do_not_train";
  } else if (requiresGpClearance && !gpClearanceObtained) {
    effectiveStatus = "pending_medical";
  } else if (autoOutstanding.length > 0) {
    effectiveStatus = "action_needed";
  } else {
    effectiveStatus = "clear";
  }

  return { requiresGpClearance, autoOutstanding, effectiveStatus };
}
