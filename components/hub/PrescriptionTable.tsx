import { Fragment } from "react";
import type { Exercise, SessionVersion } from "@/types";
import { cn } from "@/lib/utils";

interface PrescriptionTableProps {
  version: SessionVersion;
  className?: string;
}

interface ExerciseGroup {
  label: string;
  exercises: Exercise[];
}

/** Groups a list of exercises into consecutive runs by group_label. Ungrouped exercises fall under "Main Block". */
function groupExercises(exercises: Exercise[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  for (const ex of exercises) {
    const label = ex.group_label || "Main Block";
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.exercises.push(ex);
    } else {
      groups.push({ label, exercises: [ex] });
    }
  }
  return groups;
}

function isSuperset(label: string): boolean {
  return label.toLowerCase().startsWith("superset");
}

function SectionHeaderRow({ label, count }: { label: string; count: number }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="bg-rose/5 text-rose text-xs font-semibold uppercase tracking-wide px-3 py-1.5"
      >
        {label}
        {isSuperset(label) && count > 1 && (
          <span className="normal-case font-normal text-muted-foreground">
            {" "}
            — perform together, rest after the pair
          </span>
        )}
      </td>
    </tr>
  );
}

function ExerciseRows({ ex, superset }: { ex: Exercise; superset: boolean }) {
  const hasDetail = Boolean(ex.coaching_cue || ex.modification);
  const nameCellClass = cn(
    "font-medium text-foreground px-3 py-2",
    superset && "border-l-2 border-rose/30"
  );

  return (
    <>
      <tr className={hasDetail ? "" : "border-b border-[var(--hub-border)]"}>
        <td className={nameCellClass}>
          {ex.exercise_name}
          {ex.equipment?.length > 0 && (
            <div className="text-[11px] text-muted-foreground">{ex.equipment.join(", ")}</div>
          )}
        </td>
        <td className="px-3 py-2 tabular-nums whitespace-nowrap text-foreground/90">{ex.sets ?? "—"}</td>
        <td className="px-3 py-2 tabular-nums whitespace-nowrap text-foreground/90">{ex.reps || "—"}</td>
        <td className="px-3 py-2 tabular-nums whitespace-nowrap text-foreground/90">{ex.tempo || "—"}</td>
        <td className="px-3 py-2 tabular-nums whitespace-nowrap text-foreground/90">{ex.rest || "—"}</td>
      </tr>
      {hasDetail && (
        <tr className="border-b border-[var(--hub-border)]">
          <td colSpan={5} className="px-3 pb-2 pt-0 text-xs">
            {ex.coaching_cue && <span className="italic text-muted-foreground">Cue: {ex.coaching_cue}</span>}
            {ex.coaching_cue && ex.modification && " · "}
            {ex.modification && (
              <span className="text-[var(--status-warning)]">Mod: {ex.modification}</span>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function PrescriptionTable({ version, className }: PrescriptionTableProps) {
  const warmUp = version.warm_up || [];
  const mainBlock = version.main_block || [];
  const cooldown = version.cooldown || [];
  const mainGroups = groupExercises(mainBlock);

  return (
    <table className={cn("w-full text-sm", className)}>
      <thead>
        <tr>
          <th className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] px-3 py-2 text-left">
            Exercise
          </th>
          <th className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] px-3 py-2 text-left whitespace-nowrap">
            Sets
          </th>
          <th className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] px-3 py-2 text-left whitespace-nowrap">
            Reps
          </th>
          <th className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] px-3 py-2 text-left whitespace-nowrap">
            Tempo
          </th>
          <th className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] px-3 py-2 text-left whitespace-nowrap">
            Rest
          </th>
        </tr>
      </thead>
      <tbody>
        {warmUp.length > 0 && (
          <Fragment>
            <SectionHeaderRow label="Warm-up" count={warmUp.length} />
            {warmUp.map((ex, i) => (
              <ExerciseRows key={`warmup-${i}`} ex={ex} superset={false} />
            ))}
          </Fragment>
        )}
        {mainGroups.map((group, gi) => (
          <Fragment key={`main-group-${gi}`}>
            <SectionHeaderRow label={group.label} count={group.exercises.length} />
            {group.exercises.map((ex, i) => (
              <ExerciseRows key={`main-${gi}-${i}`} ex={ex} superset={isSuperset(group.label)} />
            ))}
          </Fragment>
        ))}
        {cooldown.length > 0 && (
          <Fragment>
            <SectionHeaderRow label="Cool-down" count={cooldown.length} />
            {cooldown.map((ex, i) => (
              <ExerciseRows key={`cooldown-${i}`} ex={ex} superset={false} />
            ))}
          </Fragment>
        )}
      </tbody>
    </table>
  );
}
