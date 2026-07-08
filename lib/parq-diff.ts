import { questionTextMap } from "./parq-data";
import type { SignedPARQ } from "@/types";

const CONTACT_FIELDS: { key: keyof SignedPARQ; label: string }[] = [
  { key: "date_of_birth", label: "Date of birth" },
  { key: "address", label: "Address" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "emergency_contact_name", label: "Emergency contact name" },
  { key: "emergency_contact_phone", label: "Emergency contact phone" },
  { key: "gp_name", label: "GP name" },
  { key: "gp_surgery", label: "GP surgery" },
  { key: "gp_phone", label: "GP phone" },
];

const FREE_TEXT_FIELDS: { key: keyof SignedPARQ; label: string }[] = [
  { key: "conditions", label: "Conditions (detail)" },
  { key: "medications", label: "Medications (detail)" },
  { key: "devices", label: "Devices (detail)" },
  { key: "exercise_restrictions", label: "Exercise restrictions (detail)" },
  { key: "surgeries", label: "Surgeries (detail)" },
  { key: "other_info", label: "Other info (detail)" },
  { key: "current_exercise", label: "Current exercise" },
  { key: "training_goals", label: "Training goals" },
];

const QUESTION_FIELDS: { key: keyof SignedPARQ; label: string }[] = Object.entries(questionTextMap).map(
  ([q, text]) => ({ key: q as keyof SignedPARQ, label: text }),
);

const ALL_FIELDS = [...CONTACT_FIELDS, ...QUESTION_FIELDS, ...FREE_TEXT_FIELDS];

export interface ParqDiffEntry {
  label: string;
  from: string;
  to: string;
}

/** Field-by-field diff between two PAR-Q submissions for the same client. */
export function diffParq(older: SignedPARQ, newer: SignedPARQ): ParqDiffEntry[] {
  const diffs: ParqDiffEntry[] = [];
  for (const { key, label } of ALL_FIELDS) {
    const from = String(older[key] ?? "");
    const to = String(newer[key] ?? "");
    if (from !== to) {
      diffs.push({ label, from: from || "—", to: to || "—" });
    }
  }
  return diffs;
}
