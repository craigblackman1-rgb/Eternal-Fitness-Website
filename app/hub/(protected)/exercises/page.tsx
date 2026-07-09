import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ExerciseBrowser } from "./exercise-browser";

export interface ExerciseEntry {
  id: string;
  name: string;
  source: "original" | "trainerize" | "custom";
  trainerize_custom: boolean | null;
  archetypes: string[];
  movement_type: string | null;
  muscle_groups: string[];
  equipment: string[];
  tags: string[];
  difficulty: number | null;
  intensity_tiers: string[];
  coaching_cue: string | null;
  default_mod: string | null;
  image_url: string | null;
  video_url: string | null;
}

export default async function ExercisesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  const typedExercises = (exercises ?? []) as ExerciseEntry[];

  const movementTypes = [...new Set(typedExercises.map((e) => e.movement_type).filter(Boolean))].sort();
  const allEquipment = [...new Set(typedExercises.flatMap((e) => e.equipment))].sort();
  const allMuscleGroups = [...new Set(typedExercises.flatMap((e) => e.muscle_groups))].sort();

  return (
    <ExerciseBrowser
      exercises={typedExercises}
      movementTypes={movementTypes}
      allEquipment={allEquipment}
      allMuscleGroups={allMuscleGroups}
    />
  );
}
