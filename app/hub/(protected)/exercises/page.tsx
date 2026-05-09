import { ExerciseBrowser } from "./exercise-browser";
import exerciseDb from "@/lib/exercise-db.json";
import type { Archetype } from "@/types";

export interface ExerciseEntry {
  id: string;
  name: string;
  archetypes: Archetype[];
  movement_type: string;
  equipment: string[];
  difficulty: number;
  intensity_tiers: string[];
  coaching_cue: string;
  default_mod: string;
}

export default function ExercisesPage() {
  const exercises = (exerciseDb as { exercises: ExerciseEntry[] }).exercises;

  const movementTypes = [...new Set(exercises.map((e) => e.movement_type))].sort();
  const allEquipment = [...new Set(exercises.flatMap((e) => e.equipment))].sort();

  return (
    <ExerciseBrowser
      exercises={exercises}
      movementTypes={movementTypes}
      allEquipment={allEquipment}
    />
  );
}
