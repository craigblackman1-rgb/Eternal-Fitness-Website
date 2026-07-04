import { questionTextMap } from "@/lib/parq-data";
import type { SignedPARQ } from "@/types";

const PARQ_FREE_TEXT_FIELDS: { key: keyof SignedPARQ; label: string }[] = [
  { key: "conditions", label: "Conditions" },
  { key: "medications", label: "Medications" },
  { key: "devices", label: "Devices" },
  { key: "exercise_restrictions", label: "Exercise restrictions" },
  { key: "surgeries", label: "Surgeries" },
  { key: "other_info", label: "Other info" },
];

/** Verbatim PAR-Q summary for inclusion in an AI system prompt — flagged answers + free-text detail. */
export function buildParqSection(parq: SignedPARQ | null): string {
  if (!parq) {
    return "No PAR-Q on file for this client. Do not generate a plan until one is submitted and reviewed — flag this to Esther.";
  }

  const flaggedAnswers = Object.entries(questionTextMap)
    .filter(([q]) => parq[q as keyof SignedPARQ] === "yes")
    .map(([, text]) => `- ${text}`)
    .join("\n");

  const freeText = PARQ_FREE_TEXT_FIELDS
    .filter((f) => parq[f.key])
    .map((f) => `${f.label}: ${parq[f.key]}`)
    .join("\n");

  return `PAR-Q submitted ${parq.created_at}.

Flagged (YES) screening answers:
${flaggedAnswers || "None — no risk factors flagged."}

Client-provided detail:
${freeText || "None provided."}`;
}
