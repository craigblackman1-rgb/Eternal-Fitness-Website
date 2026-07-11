/**
 * Plan Agent acceptance test — runs a REAL block generation for a client from a
 * JSON context dump and prints the result with a muscle-group coverage audit.
 *
 * Per EF_Plan_Agent_Charter_Jul2026.md §7, any change to the Plan Agent's
 * prompts, settings, equipment, or a client's rules must be followed by an
 * actual test generation — this script is that test, runnable without the app
 * or a DB connection.
 *
 * Usage:
 *   pnpm dlx tsx scripts/test-plan-generation.mts <context.json> [out.json]
 *
 * The context JSON has keys CLIENT, BLOCKS, PARQ, UPDATES, RULETYPES,
 * EQUIPMENT, SETTINGS, EXTAGGED, EXNAMES (see the SQL in the 2026-07-11
 * session handoff for how to dump it). Requires ANTHROPIC_API_KEY (read from
 * .env.local if not already set). Costs real API money — a 1x/week block is
 * 6 Opus calls, a 3x/week block is 18.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Load ANTHROPIC_API_KEY from .env.local without persisting it anywhere.
if (!process.env.ANTHROPIC_API_KEY) {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf-8").split("\n")) {
      const m = line.match(/^(ANTHROPIC_API_KEY|PLAN_MODEL)=(.*)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {
    // fall through to the check below
  }
}
if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) {
  console.error("No ANTHROPIC_API_KEY or OPENROUTER_API_KEY set (checked env and .env.local)");
  process.exit(1);
}

const contextPath = process.argv[2];
if (!contextPath) {
  console.error("usage: pnpm dlx tsx scripts/test-plan-generation.mts <context.json> [out.json]");
  process.exit(1);
}
const ctx = JSON.parse(readFileSync(contextPath, "utf-8"));

const { generateViaAi } = await import("../lib/planGeneration");
const { resolveClientSplit } = await import("../lib/planAgentPrompt");
const { buildExerciseIndex, sessionMuscleCoverage, validateGeneratedSession } = await import("../lib/planValidation");

// v2 retires these settings — drop them if the dump came from a pre-migration DB.
const RETIRED = new Set([
  "session_structure_template", "loading_principles",
  "checklist_before_building", "checklist_building_sessions", "checklist_after_building",
]);

const settings = Object.fromEntries(
  (ctx.SETTINGS ?? [])
    .filter((s: { key: string }) => !RETIRED.has(s.key))
    .map((s: { key: string; value_type: string; value: unknown }) => [s.key, { value_type: s.value_type, value: s.value }]),
);

const tagged = ctx.EXTAGGED ?? [];
const taggedByName = new Map(tagged.map((e: { name: string }) => [e.name, e]));
const allExercises = (ctx.EXNAMES ?? []).map((e: { name: string; equipment: string[] }) =>
  taggedByName.get(e.name) ?? { name: e.name, source: "trainerize", movement_type: null, muscle_groups: [], equipment: e.equipment ?? [] },
);

const bundle = {
  blocks: ctx.BLOCKS ?? [],
  parq: ctx.PARQ ?? null,
  recentUpdates: ctx.UPDATES ?? [],
  ruleTypesById: Object.fromEntries((ctx.RULETYPES ?? []).map((rt: { id: string; label: string; bucket: string }) => [rt.id, { label: rt.label, bucket: rt.bucket }])),
  equipmentRows: ctx.EQUIPMENT ?? [],
  settings,
  menuExercises: tagged,
  allExercises,
};

const client = ctx.CLIENT;
const profile = client.profile;
const split = resolveClientSplit(settings, profile?.logistics?.split);
const index = buildExerciseIndex(allExercises);

console.log(`Client: ${client.name} (#${client.client_number}) — ${profile.logistics.sessions_per_week}x/week, pace ${client.pace_mode}, split "${split.label}"`);
console.log(`Menu: ${tagged.length} tagged exercises | validation universe: ${allExercises.length}`);
console.log(`Generating…\n`);

const started = Date.now();
const sessions = await generateViaAi(profile, client.pace_mode ?? "medium", bundle, process.argv[4]);
console.log(`Generated ${sessions.length} sessions in ${Math.round((Date.now() - started) / 1000)}s\n`);

for (const s of sessions) {
  console.log(`─── Session ${s.session_number} — week ${s.week} (${s.phase}) — ${s.focus_label}`);
  const studio = s.versions.studio;
  const fmt = (ex: { exercise_name: string; sets: number; reps: string; tempo: string; rest: string; group_label?: string }) =>
    `    ${ex.group_label ? `[${ex.group_label}] ` : ""}${ex.exercise_name} — ${ex.sets}x${ex.reps}, tempo ${ex.tempo}, rest ${ex.rest}`;
  console.log("  Warm-up:");
  studio.warm_up.forEach((ex) => console.log(fmt(ex)));
  console.log("  Main block:");
  studio.main_block.forEach((ex) => console.log(fmt(ex)));
  console.log("  Cooldown:");
  studio.cooldown.forEach((ex) => console.log(fmt(ex)));

  const coverage = sessionMuscleCoverage(s, index);
  const audit = split.groups.map((g) => `${g}: ${coverage.get(g)?.length ? "✓" : "✗ MISSING"}`).join("  ");
  console.log(`  Coverage: ${audit}`);
  const violations = validateGeneratedSession(s, index, bundle.equipmentRows.map((e: { name: string }) => e.name), split);
  if (violations.length) {
    console.log(`  VIOLATIONS:\n${violations.map((v) => `    - [${v.type}] ${v.detail}`).join("\n")}`);
  }
  if (s.coaching_notes) console.log(`  Notes: ${s.coaching_notes}`);
  console.log();
}

const outPath = process.argv[3] ?? join(dirname(contextPath), "generated-block.json");
writeFileSync(outPath, JSON.stringify(sessions, null, 2));
console.log(`Full block written to ${outPath}`);
