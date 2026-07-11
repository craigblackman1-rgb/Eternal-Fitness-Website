"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { HubCard, HubCardHeader } from "@/components/hub";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp, IconDumbbell, IconPlus, IconSearch, IconVideo, IconEdit3 } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import type { Archetype } from "@/types";
import type { ExerciseEntry } from "./page";
import { ExerciseMediaPlaceholder } from "@/components/exercise-media";
import { ExerciseFormDialog } from "./ExerciseFormDialog";
import { toast } from "sonner";

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

function sourceLabel(source: ExerciseEntry["source"]): string {
  if (source === "original") return "Original";
  if (source === "trainerize") return "Trainerize";
  return "Custom";
}

export function ExerciseBrowser({
  exercises,
  movementTypes,
  allEquipment,
  allMuscleGroups,
}: {
  exercises: ExerciseEntry[];
  movementTypes: string[];
  allEquipment: string[];
  allMuscleGroups: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [archetypeFilter, setArchetypeFilter] = useState<Archetype | "all">("all");
  const [movementFilter, setMovementFilter] = useState("all");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<ExerciseEntry["source"] | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<number>(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingExercise, setEditingExercise] = useState<ExerciseEntry | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkArchetypes, setBulkArchetypes] = useState<Archetype[]>([]);
  const [bulkEquipment, setBulkEquipment] = useState("");
  const [bulkMuscleGroups, setBulkMuscleGroups] = useState("");
  const [bulkTags, setBulkTags] = useState("");
  const [bulkActive, setBulkActive] = useState<boolean | null>(null);
  const PAGE_SIZE = 60;

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (archetypeFilter !== "all" && !ex.archetypes.includes(archetypeFilter)) return false;
      if (movementFilter !== "all" && ex.movement_type !== movementFilter) return false;
      if (muscleFilter !== "all" && !ex.muscle_groups.includes(muscleFilter)) return false;
      if (equipmentFilter !== "all" && !ex.equipment.includes(equipmentFilter)) return false;
      if (sourceFilter !== "all" && ex.source !== sourceFilter) return false;
      if (difficultyFilter > 0 && (ex.difficulty == null || ex.difficulty > difficultyFilter)) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, search, archetypeFilter, movementFilter, muscleFilter, equipmentFilter, sourceFilter, difficultyFilter]);

  const filteredIds = useMemo(() => new Set(filtered.map((e) => e.id)), [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paginated = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const resetAndSet = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch("");
    setArchetypeFilter("all");
    setMovementFilter("all");
    setMuscleFilter("all");
    setEquipmentFilter("all");
    setSourceFilter("all");
    setDifficultyFilter(0);
    setPage(0);
  };

  const hasFilters = search || archetypeFilter !== "all" || movementFilter !== "all" || muscleFilter !== "all" || equipmentFilter !== "all" || sourceFilter !== "all" || difficultyFilter > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const splitCommaField = (value: string): string[] =>
    value.split(",").map((v) => v.trim()).filter(Boolean);

  async function handleBulkApply() {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      const payload: Record<string, unknown> = { ids: [...selectedIds] };
      if (bulkArchetypes.length > 0) payload.addArchetypes = bulkArchetypes;
      if (bulkEquipment.trim()) payload.addEquipment = splitCommaField(bulkEquipment);
      if (bulkMuscleGroups.trim()) payload.addMuscleGroups = splitCommaField(bulkMuscleGroups);
      if (bulkTags.trim()) payload.addTags = splitCommaField(bulkTags);
      if (bulkActive !== null) payload.active = bulkActive;

      const res = await fetch("/api/exercises/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Bulk update failed");
      }

      toast.success(`${selectedIds.size} exercise${selectedIds.size > 1 ? "s" : ""} updated`);
      clearSelection();
      setBulkArchetypes([]);
      setBulkEquipment("");
      setBulkMuscleGroups("");
      setBulkTags("");
      setBulkActive(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Exercise Library</h1>
          <p className="text-muted-foreground">
            {exercises.length} exercises &middot; {filtered.length} match
            {filtered.length > 0 && ` · page ${safePage + 1} of ${pageCount}`}
          </p>
        </div>
        <ExerciseFormDialog
          trigger={
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
              <IconPlus className="h-4 w-4" />
              Add Exercise
            </Button>
          }
        />
      </div>

      {selectedIds.size > 0 && (
        <HubCard padded={false}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{selectedIds.size} selected</span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkApply}
                  disabled={bulkSaving}
                  className="rounded-full"
                >
                  {bulkSaving ? "Applying..." : "Apply Changes"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">Add archetypes:</span>
              {(["A", "B", "C"] as Archetype[]).map((a) => (
                <label key={a} className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={bulkArchetypes.includes(a)}
                    onCheckedChange={() =>
                      setBulkArchetypes((prev) =>
                        prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                      )
                    }
                  />
                  Type {a}
                </label>
              ))}

              <span className="text-xs font-medium text-muted-foreground">Add equipment:</span>
              <Input
                className="h-7 w-40 text-xs"
                value={bulkEquipment}
                onChange={(e) => setBulkEquipment(e.target.value)}
                placeholder="e.g. dumbbell, mat"
              />

              <span className="text-xs font-medium text-muted-foreground">Add muscles:</span>
              <Input
                className="h-7 w-40 text-xs"
                value={bulkMuscleGroups}
                onChange={(e) => setBulkMuscleGroups(e.target.value)}
                placeholder="e.g. quads, glutes"
              />

              <span className="text-xs font-medium text-muted-foreground">Add tags:</span>
              <Input
                className="h-7 w-36 text-xs"
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
                placeholder="e.g. bilateral"
              />

              <span className="text-xs font-medium text-muted-foreground">Active:</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={bulkActive === true ? "default" : "outline"}
                  className="h-7 text-xs rounded-full"
                  onClick={() => setBulkActive(bulkActive === true ? null : true)}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={bulkActive === false ? "default" : "outline"}
                  className="h-7 text-xs rounded-full"
                  onClick={() => setBulkActive(bulkActive === false ? null : false)}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>
        </HubCard>
      )}

      <div className="space-y-4">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Archetype:</span>
          {(["all", "A", "B", "C"] as const).map((a) => (
            <button
              key={a}
              onClick={() => { setArchetypeFilter(a); setPage(0); }}
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
          <Select value={movementFilter} onValueChange={resetAndSet(setMovementFilter)}>
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

          <Select value={muscleFilter} onValueChange={resetAndSet(setMuscleFilter)}>
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue placeholder="Main muscle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All muscles</SelectItem>
              {allMuscleGroups.map((mg) => (
                <SelectItem key={mg} value={mg}>
                  {mg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={equipmentFilter} onValueChange={resetAndSet(setEquipmentFilter)}>
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

          <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v as ExerciseEntry["source"] | "all"); setPage(0); }}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="trainerize">Trainerize</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(difficultyFilter)} onValueChange={(v) => { setDifficultyFilter(Number(v)); setPage(0); }}>
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
          {paginated.map((ex) => (
            <HubCard
              key={ex.id}
              className="cursor-pointer transition-colors hover:border-rose/50"
              onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
            >
              <HubCardHeader
                icon={
                  ex.image_url ? (
                    <img
                      src={ex.image_url}
                      alt={ex.name}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  ) : (
                    <IconDumbbell className="w-4 h-4" />
                  )
                }
                title={ex.name}
                subtitle={`${ex.movement_type ? movementTypeLabels[ex.movement_type] || ex.movement_type : "Untagged"} · ${ex.difficulty != null ? difficultyLabel(ex.difficulty) : "Untagged"}`}
                color="teal"
                action={
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingExercise(ex);
                      }}
                      className="p-1 rounded-md hover:bg-muted/60 transition-colors"
                      title="Edit exercise"
                    >
                      <IconEdit3 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {sourceLabel(ex.source)}
                      </Badge>
                      {ex.source === "trainerize" && ex.trainerize_custom === true && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Esther&apos;s Custom
                        </Badge>
                      )}
                      {ex.archetypes.map((a) => (
                        <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                }
                noBottomPadding
              />
              <div className="px-5 pb-5">
                {ex.muscle_groups.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {ex.muscle_groups.map((mg) => (
                      <span
                        key={mg}
                        className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {mg}
                      </span>
                    ))}
                  </div>
                )}

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
                    <Checkbox
                      checked={selectedIds.has(ex.id)}
                      onCheckedChange={() => toggleSelect(ex.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mr-1"
                    />
                    <span>Click for details</span>
                    <IconChevronDown className="h-3 w-3" />
                  </div>
                ) : null}

                {expanded === ex.id && (
                  <div className="space-y-3 text-xs">
                    {ex.image_url ? (
                      <img
                        src={ex.image_url}
                        alt={ex.name}
                        className="w-full rounded-lg object-cover max-h-48"
                      />
                    ) : ex.video_url ? (
                      <a
                        href={ex.video_url}
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
                    {ex.video_url && (
                      <a
                        href={ex.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-rose hover:underline"
                      >
                        <IconVideo className="h-3 w-3" />
                        Watch demo video
                      </a>
                    )}
                    <div>
                      <span className="font-medium text-muted-foreground">Coaching: </span>
                      <p className="mt-0.5">{ex.coaching_cue ?? "—"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Modification: </span>
                      <p className="mt-0.5 text-amber-700">{ex.default_mod ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>Collapse</span>
                      <IconChevronUp className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            </HubCard>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 rounded-full"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <IconChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 rounded-full"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ExerciseFormDialog
        exercise={editingExercise}
        open={editingExercise !== null}
        onOpenChange={(val) => { if (!val) setEditingExercise(null); }}
      />
    </div>
  );
}
