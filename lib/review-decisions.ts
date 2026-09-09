import type { ReviewDecision } from "@/types";

/**
 * Canonical review decisions — shared between the full review flow
 * (ReviewFlowClient) and the block review (BlockReviewClient).
 *
 * Semantics:
 * - continue = on track, no changes
 * - adjust   = tweak something without starting over
 * - restart  = what has been delivered no longer fits; start a new programme
 */
export const REVIEW_DECISIONS: Record<ReviewDecision, { label: string; desc: string; tone: string }> = {
  continue: {
    label: "Continue as is",
    desc: "No changes to the plan. Confirms things are on track and closes this review.",
    tone: "success",
  },
  adjust: {
    label: "Adjust the programme",
    desc: "Something needs to change — equipment, intensity, or a specific exercise — without starting over.",
    tone: "primary",
  },
  restart: {
    label: "Start a new programme",
    desc: "What has been delivered no longer fits — record the decision and set up a new programme manually.",
    tone: "warning",
  },
};

/** Title line for the consequence box. */
export function consequenceTitle(decision: ReviewDecision | null): string {
  if (!decision) return "Choose one to see what happens next.";
  return `${REVIEW_DECISIONS[decision].label} — selected`;
}

/**
 * Body copy for the consequence box, parameterised by who and what block
 * is in scope. The block number is optional — the full review flow does not
 * always have one.
 */
export function consequenceBody(
  decision: ReviewDecision | null,
  clientFirstName: string,
  blockNumber?: number,
): string {
  if (!decision) return "Nothing is recorded until you confirm below.";
  switch (decision) {
    case "continue":
      return blockNumber
        ? `Programme ${blockNumber} runs as planned — recorded as on track for ${clientFirstName}. No follow-up task is created.`
        : `Recorded as on track for ${clientFirstName}. No follow-up task is created.`;
    case "adjust":
      return `Takes you to Add a workout for ${clientFirstName} next, to bring in the change — the same short flow used to add any workout, nothing else to set up first.`;
    case "restart":
      return blockNumber
        ? `Records the decision to start fresh. Programme ${blockNumber} stays open — you end it and set up the new one from Add a workout, which is available on the next screen.`
        : `Records the decision to start fresh. The current programme stays open — you end it and set up the new one from Add a workout, which is available on the next screen.`;
  }
}

/**
 * Confirmation copy — tells the trainer where this decision surfaces
 * and what (if anything) to do next.
 */
export function confirmationWhereText(
  decision: ReviewDecision,
  clientName: string,
  clientFirstName: string,
): string {
  const base = `${clientName}'s overview panel as the latest review outcome, and in the review history below.`;
  if (decision === "continue") {
    return `${base} No further action is scheduled.`;
  }
  return `${base} Add a workout for ${clientFirstName} is available on the next screen if you are ready to set up the new programme.`;
}
