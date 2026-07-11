import type { SentUpdate, SignedPARQ, TrainingRuleType } from "@/types";
import type { EquipmentRow, ExerciseLibraryRow, PlanAgentSettingsMap } from "@/lib/planAgentPrompt";

/**
 * Shared Plan Agent data loading — one fetch bundle used by BOTH plan-chat and
 * generate-block, so the conversation and the generated block always see the
 * same client context (generate-block previously received no PAR-Q, updates,
 * or block history at all).
 */

export interface BlockHistoryRow {
  block_number: number;
  block_note: string | null;
  status: string;
  created_at: string;
}

export interface PlanAgentBundle {
  blocks: BlockHistoryRow[];
  parq: SignedPARQ | null;
  recentUpdates: SentUpdate[];
  ruleTypesById: Record<string, Pick<TrainingRuleType, "label" | "bucket">>;
  equipmentRows: EquipmentRow[];
  settings: PlanAgentSettingsMap;
  /** Tagged library rows — the allowed menu shown to the model. */
  menuExercises: ExerciseLibraryRow[];
  /** Every active library row — the validation universe. */
  allExercises: ExerciseLibraryRow[];
}

// Matches the PostgREST-compatible shim in lib/pg-client.ts — only the query
// surface this module actually uses.
type SupabaseLike = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export async function loadPlanAgentBundle(supabase: SupabaseLike, clientId: string): Promise<PlanAgentBundle> {
  const [blocksRes, parqRes, updatesRes, ruleTypesRes, equipmentRes, settingsRes, exercisesRes] = await Promise.all([
    supabase
      .from("blocks")
      .select("block_number, block_note, status, created_at")
      .eq("client_id", clientId)
      .order("block_number", { ascending: false })
      .limit(5),
    supabase
      .from("signed_parq")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sent_updates")
      .select("*")
      .eq("client_id", clientId)
      .order("sent_at", { ascending: false })
      .limit(2),
    supabase.from("training_rule_types").select("id, label, bucket"),
    supabase
      .from("studio_equipment")
      .select("name, detail, home_equivalent")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("plan_agent_settings").select("key, value_type, value"),
    supabase
      .from("exercises")
      .select("name, source, movement_type, muscle_groups, equipment, coaching_cue, default_mod, trainerize_custom")
      .eq("active", true),
  ]);

  const ruleTypesById = Object.fromEntries(
    ((ruleTypesRes.data ?? []) as TrainingRuleType[]).map((rt) => [rt.id, { label: rt.label, bucket: rt.bucket }]),
  );

  const settings: PlanAgentSettingsMap = Object.fromEntries(
    ((settingsRes.data ?? []) as { key: string; value_type: string; value: unknown }[]).map((row) => [
      row.key,
      { value_type: row.value_type, value: row.value },
    ]),
  );

  const allExercises = (exercisesRes.data ?? []) as (ExerciseLibraryRow & { trainerize_custom: boolean | null })[];
  // The menu is the tagged subset — the originals plus everything with muscle
  // groups or flagged as Esther's own Trainerize custom set. Untagged stock
  // rows stay valid (validation runs against allExercises) but aren't offered.
  const menuExercises = allExercises.filter(
    (e) => e.source === "original" || (e.muscle_groups?.length ?? 0) > 0 || e.trainerize_custom,
  );

  return {
    blocks: (blocksRes.data ?? []) as BlockHistoryRow[],
    parq: (parqRes.data ?? null) as SignedPARQ | null,
    recentUpdates: (updatesRes.data ?? []) as SentUpdate[],
    ruleTypesById,
    equipmentRows: (equipmentRes.data ?? []) as EquipmentRow[],
    settings,
    menuExercises,
    allExercises,
  };
}

export function buildBlockHistoryText(blocks: BlockHistoryRow[]): string {
  return blocks.length > 0
    ? blocks.map((b) => `Block ${b.block_number}: ${b.block_note ?? "No note"} [Status: ${b.status}]`).join("\n")
    : "No previous blocks.";
}
