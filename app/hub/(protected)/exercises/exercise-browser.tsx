"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconChevronDown, IconChevronUp, IconDumbbell, IconSearch, IconVideo } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import type { Archetype } from "@/types";
import type { ExerciseEntry } from "./page";
import { ExerciseMediaPlaceholder } from "@/components/exercise-media";

const movementTypeLabels: Record<string, string> = {
  spinal_mobility: "Spinal Mobility",
  upper_body_mobility: "Upper Body Mobility",
  lower_body_mobility: "Lower Body Mobility",
  full_body_mobility: "Full Body Mobility",
  rest_recovery: "Rest & Recovery",
  hinge_pattern: "Hinge Pattern",
  squat_pattern: "Squat Pattern",
  lunge_pattern: "Lunge Pattern",
  horizontal_push: "Horizontal Push",
  horizontal_pull: "Horizontal Pull",
  vertical_push: "Vertical Push",
  pull_accessory: "Pull Accessory",
  push_accessory: "Push Accessory",
  loaded_carry: "Loaded Carry",
  core_anterior: "Core — Anterior",
  core_posterior: "Core — Posterior",
  core_lateral: "Core — Lateral",
  power_output: "Power Output",
  lateral_movement: "Lateral Movement",
  locomotion: "Locomotion",
  cardio: "Cardio",
  mobility_dynamic: "Dynamic Mobility",
};

const equipmentLabels: Record<string, string> = {
  mat: "Mat",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  "resistance band": "Band",
  "barbell+plates": "Barbell",
  TRX: "TRX",
  "step/box": "Step/Box",
  "stationary bike": "Bike",
  treadmill: "Treadmill",
  "rowing machine": "Rower",
  "stability ball": "Stability Ball",
  "foam roller": "Foam Roller",
};

function difficultyLabel(d: number): string {
  if (d <= 1) return "Beginner";
  if (d <= 2) return "Easy";
  if (d <= 3) return "Intermediate";
  if (d <= 4) return "Advanced";
  return "Expert";
}

export function ExerciseBrowser({
  exercises,
  movementTypes,
  allEquipment,
}: {
  exercises: ExerciseEntry[];
  movementTypes: string[];
  allEquipment: string[];
}) {
  const [search, setSearch] = useState("");
  const [archetypeFilter, setArchetypeFilter] = useState<Archetype | "all">("all");
  const [movementFilter, setMovementFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState<number>(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (archetypeFilter !== "all" && !ex.archetypes.includes(archetypeFilter)) return false;
      if (movementFilter !== "all" && ex.movement_type !== movementFilter) return false;
      if (equipmentFilter !== "all" && !ex.equipment.includes(equipmentFilter)) return false;
      if (difficultyFilter > 0 && ex.difficulty > difficultyFilter) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, search, archetypeFilter, movementFilter, equipmentFilter, difficultyFilter]);

  const clearFilters = () => {
    setSearch("");
    setArchetypeFilter("all");
    setMovementFilter("all");
    setEquipmentFilter("all");
    setDifficultyFilter(0);
  };

  const hasFilters = search || archetypeFilter !== "all" || movementFilter !== "all" || equipmentFilter !== "all" || difficultyFilter > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Exercise Library</h1>
          <p className="text-muted-foreground">{exercises.length} exercises &middot; {filtered.length} shown</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Archetype:</span>
          {(["all", "A", "B", "C"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setArchetypeFilter(a)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                archetypeFilter === a
                  ? "bg-rose text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {a === "all" ? "All" : `Type ${a}`}
            </button>
          ))}

          <span className="ml-2 text-xs font-medium text-muted-foreground">Type:</span>
          <Select value={movementFilter} onValueChange={setMovementFilter}>
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue placeholder="Movement type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {movementTypes.map((mt) => (
                <SelectItem key={mt} value={mt}>
                  {movementTypeLabels[mt] || mt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All equipment</SelectItem>
              {allEquipment.filter(Boolean).map((eq) => (
                <SelectItem key={eq} value={eq}>
                  {equipmentLabels[eq] || eq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(difficultyFilter)} onValueChange={(v) => setDifficultyFilter(Number(v))}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue placeholder="Max difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any level</SelectItem>
              <SelectItem value="1">Beginner (1)</SelectItem>
              <SelectItem value="2">Easy (2)</SelectItem>
              <SelectItem value="3">Intermediate (3)</SelectItem>
              <SelectItem value="4">Advanced (4)</SelectItem>
              <SelectItem value="5">Expert (5)</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconDumbbell className="h-8 w-8" />}
          title="No exercises match your filters"
          description="Try adjusting or clearing your search filters."
          cta={{ label: "Clear filters", onClick: clearFilters }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <Card
              key={ex.id}
              className="cursor-pointer transition-colors hover:border-rose/50"
              onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{ex.name}</CardTitle>
                  <div className="flex gap-1">
                    {ex.archetypes.map((a) => (
                      <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{movementTypeLabels[ex.movement_type] || ex.movement_type}</span>
                  <span>&middot;</span>
                  <span>{difficultyLabel(ex.difficulty)}</span>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {ex.equipment.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {ex.equipment.map((eq) => (
                      <span
                        key={eq}
                        className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {equipmentLabels[eq] || eq}
                      </span>
                    ))}
                  </div>
                )}

                {ex.intensity_tiers && (
                  <div className="mb-2 flex gap-1">
                    {(["compact", "standard", "extended"] as const).map((tier) => (
                      <span
                        key={tier}
                        className={`text-[10px] ${
                          ex.intensity_tiers.includes(tier)
                            ? "text-rose font-medium"
                            : "text-muted-foreground/30"
                        }`}
                      >
                        {tier === "compact" ? "~45m" : tier === "standard" ? "~60m" : "~75m"}
                        {tier !== "extended" && <span className="mx-0.5">&middot;</span>}
                      </span>
                    ))}
                  </div>
                )}

                {!expanded || expanded !== ex.id ? (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>Click for details</span>
                    <IconChevronDown className="h-3 w-3" />
                  </div>
                ) : null}

                {expanded === ex.id && (
                  <div className="space-y-3 text-xs">
                    {ex.media?.video_url ? (
                      <a
                        href={ex.media.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-rose hover:underline"
                      >
                        <IconVideo className="h-3 w-3" />
                        Watch demo video
                      </a>
                    ) : (
                      <ExerciseMediaPlaceholder exerciseName={ex.name} />
                    )}
                    <div>
                      <span className="font-medium text-muted-foreground">Coaching: </span>
                      <p className="mt-0.5">{ex.coaching_cue}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Modification: </span>
                      <p className="mt-0.5 text-amber-700">{ex.default_mod}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>Collapse</span>
                      <IconChevronUp className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
