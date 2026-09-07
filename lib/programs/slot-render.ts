/**
 * Client-safe slot-to-session rendering — BUG-EF-133.
 *
 * Pure functions that convert programme SlotData (sections-based) into the
 * SessionVersion format (warm_up/main_block/cooldown) used by the existing
 * session UI. Split from delivery.ts so mobile client components can resolve
 * programme content without pulling in pg.
 */

import type {
  SlotData,
  ProgramExercise,
  ProgramSection,
} from './types';
import type { Exercise, SessionVersion } from '@/types';

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/** Derive group_label from a ProgramSection for multi-exercise supersets/circuits. */
function sectionGroupLabel(section: ProgramSection): string | undefined {
  if (
    (section.kind === "superset" || section.kind === "circuit") &&
    section.exercises.length > 1
  ) {
    const label = section.label?.trim();
    return label || (section.kind === "superset" ? "Superset" : "Circuit");
  }
  return undefined;
}

/**
 * Convert ProgramExercise → Exercise, filling required fields with empty
 * defaults. Preserves exercise_name, sets, reps, load, group_label.
 */
function programExerciseToExercise(
  pe: ProgramExercise,
  groupLabel?: string,
): Exercise {
  return {
    exercise_name: pe.exercise_name,
    sets: pe.sets ?? 1,
    reps: pe.reps ?? "10",
    tempo: "",
    rest: "",
    coaching_cue: "",
    modification: "",
    load: pe.weight,
    equipment: [],
    group_label: groupLabel,
  };
}

/**
 * Transform a SlotData (sections-based) into a SessionVersion
 * (warm_up/main_block/cooldown). Maps section kinds to version keys.
 * Preserves group_label on superset/circuit exercises.
 */
export function slotToSessionVersion(
  slotData: SlotData,
  exerciseMetaByName?: Map<string, Exercise>,
): SessionVersion {
  const warmUp: Exercise[] = [];
  const mainBlock: Exercise[] = [];
  const cooldown: Exercise[] = [];

  for (const section of slotData.sections) {
    const groupLabel = sectionGroupLabel(section);

    for (const pe of section.exercises) {
      let ex = programExerciseToExercise(pe, groupLabel);

      // Carry media/equipment/group_label from previous stamped session of
      // the same archetype, matching by exercise name.
      if (exerciseMetaByName) {
        const meta = exerciseMetaByName.get(pe.exercise_name.toLowerCase());
        if (meta) {
          if (meta.media) ex.media = meta.media;
          if (meta.equipment?.length) ex.equipment = meta.equipment;
          if (meta.group_label) ex.group_label = meta.group_label;
        }
      }

      switch (section.kind) {
        case "warmup":
          warmUp.push(ex);
          break;
        case "cooldown":
          cooldown.push(ex);
          break;
        default:
          // straight, superset, circuit → main_block
          mainBlock.push(ex);
          break;
      }
    }
  }

  return { warm_up: warmUp, main_block: mainBlock, cooldown: cooldown };
}
