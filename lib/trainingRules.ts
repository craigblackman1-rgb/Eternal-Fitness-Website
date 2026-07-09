import type { TrainingRule, TrainingRuleBucket, TrainingRuleType } from "@/types";

const BUCKET_HEADINGS: Record<TrainingRuleBucket, string> = {
  exclusion: "NEVER PROGRAMME (hard exclusions)",
  restriction: "MUST FOLLOW (position/structural restrictions)",
  emphasis: "PRIORITISE (muscle-group emphasis)",
  structural: "SESSION STRUCTURE REQUIREMENTS",
  coaching_style: "COACHING / COMMUNICATION STYLE",
  general: "OTHER CLIENT-SPECIFIC NOTES (unclassified — treat as hard unless marked soft)",
};

const BUCKET_ORDER: TrainingRuleBucket[] = ["exclusion", "restriction", "structural", "emphasis", "coaching_style", "general"];

/**
 * Deterministically assembles a client's structured training rules into a prompt
 * section grouped by bucket, so the model doesn't have to infer structure from a
 * flat JSON array. Pure function — mirrors lib/compliance.ts::computeComplianceFlags.
 */
export function buildTrainingRulesSection(
  rules: TrainingRule[],
  ruleTypesById: Record<string, Pick<TrainingRuleType, "label" | "bucket">>,
): string {
  if (!rules || rules.length === 0) {
    return "None recorded for this client.";
  }

  const byBucket = new Map<TrainingRuleBucket, TrainingRule[]>();
  for (const rule of rules) {
    const bucket = ruleTypesById[rule.rule_type_id]?.bucket ?? "general";
    if (!byBucket.has(bucket)) byBucket.set(bucket, []);
    byBucket.get(bucket)!.push(rule);
  }

  const sections: string[] = [];
  for (const bucket of BUCKET_ORDER) {
    const bucketRules = byBucket.get(bucket);
    if (!bucketRules || bucketRules.length === 0) continue;
    const lines = bucketRules.map((rule) => {
      const label = ruleTypesById[rule.rule_type_id]?.label;
      const tag = rule.severity === "hard" ? "[HARD]" : "[soft]";
      return `- ${tag} ${rule.detail}${label ? ` (${label})` : ""}`;
    });
    sections.push(`${BUCKET_HEADINGS[bucket]}:\n${lines.join("\n")}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : "None recorded for this client.";
}
