import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    ids: string[];
    addArchetypes?: string[];
    addEquipment?: string[];
    addMuscleGroups?: string[];
    addTags?: string[];
    active?: boolean;
  };

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids array is required and must not be empty" }, { status: 400 });
  }

  const errors: string[] = [];
  let updatedCount = 0;

  for (const id of body.ids) {
    const { data: existing, error: fetchError } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      errors.push(`Exercise ${id} not found`);
      continue;
    }

    const updates: Record<string, unknown> = {};

    if (body.addArchetypes && body.addArchetypes.length > 0) {
      const merged = [...new Set([...(existing.archetypes ?? []), ...body.addArchetypes])];
      updates.archetypes = merged;
    }

    if (body.addEquipment && body.addEquipment.length > 0) {
      const merged = [...new Set([...(existing.equipment ?? []), ...body.addEquipment])];
      updates.equipment = merged;
    }

    if (body.addMuscleGroups && body.addMuscleGroups.length > 0) {
      const merged = [...new Set([...(existing.muscle_groups ?? []), ...body.addMuscleGroups])];
      updates.muscle_groups = merged;
    }

    if (body.addTags && body.addTags.length > 0) {
      const merged = [...new Set([...(existing.tags ?? []), ...body.addTags])];
      updates.tags = merged;
    }

    if (body.active !== undefined) {
      updates.active = body.active;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("exercises")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        errors.push(`Failed to update ${id}: ${updateError.message}`);
      } else {
        updatedCount++;
      }
    } else {
      updatedCount++;
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Some updates failed", details: errors, updatedCount },
      { status: 207 }
    );
  }

  return NextResponse.json({ updatedCount });
}
