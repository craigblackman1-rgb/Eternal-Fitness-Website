import { describe, it, expect } from "vitest";
import { dedupeWorkoutsByContent } from "../programs/dedupe-workouts";
import type { ParsedSlot, SlotData } from "../programs/types";

// ── helpers ──────────────────────────────────────────────────────────

function makeSlot(
  label: string,
  exercises: { name: string; sets?: number; reps?: string }[],
): ParsedSlot {
  return {
    label,
    data: {
      sections: [
        {
          kind: "straight",
          exercises: exercises.map((e) => ({
            exercise_name: e.name,
            sets: e.sets ?? 3,
            reps: e.reps ?? "10",
          })),
        },
      ],
    },
  };
}

function makeMultiSectionSlot(
  label: string,
  sections: { kind: string; exercises: { name: string; sets?: number; reps?: string }[] }[],
): ParsedSlot {
  return {
    label,
    data: {
      sections: sections.map((s) => ({
        kind: s.kind as ParsedSlot["data"]["sections"][0]["kind"],
        exercises: s.exercises.map((e) => ({
          exercise_name: e.name,
          sets: e.sets ?? 3,
          reps: e.reps ?? "10",
        })),
      })),
    },
  };
}

function exerciseCount(slot: ParsedSlot): number {
  return slot.data.sections.reduce((n, s) => n + s.exercises.length, 0);
}

// ── tests ────────────────────────────────────────────────────────────

describe("dedupeWorkoutsByContent", () => {
  it("(a) same content, 'X' + 'X - Copy' → 1 kept, named 'X'", () => {
    const slots = [
      makeSlot("Workout A", [{ name: "Squat" }, { name: "Press" }]),
      makeSlot("Workout A - Copy", [{ name: "Squat" }, { name: "Press" }]),
    ];
    const result = dedupeWorkoutsByContent(slots);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Workout A");
  });

  it("(a-variant) Copy arrives first, original second → still keeps original name", () => {
    const slots = [
      makeSlot("Workout A - Copy", [{ name: "Squat" }, { name: "Press" }]),
      makeSlot("Workout A", [{ name: "Squat" }, { name: "Press" }]),
    ];
    const result = dedupeWorkoutsByContent(slots);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Workout A");
  });

  it("(b) same name, different content → 2 kept", () => {
    const slots = [
      makeSlot("Workout A", [{ name: "Squat" }, { name: "Press" }]),
      makeSlot("Workout A", [{ name: "Deadlift" }, { name: "Row" }]),
    ];
    const result = dedupeWorkoutsByContent(slots);
    expect(result).toHaveLength(2);
  });

  it("(c) three-way: two identical + one distinct → 2 kept", () => {
    const slots = [
      makeSlot("Workout A", [{ name: "Squat" }, { name: "Press" }]),
      makeSlot("Workout A - Copy", [{ name: "Squat" }, { name: "Press" }]),
      makeSlot("Workout B", [{ name: "Deadlift" }, { name: "Row" }]),
    ];
    const result = dedupeWorkoutsByContent(slots);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.label)).toEqual(["Workout A", "Workout B"]);
  });

  it("(d) order preserved — kept entries appear in their original positions", () => {
    const slots = [
      makeSlot("First", [{ name: "A" }]),
      makeSlot("Second", [{ name: "B" }]),
      makeSlot("First - Copy", [{ name: "A" }]),
      makeSlot("Third", [{ name: "C" }]),
      makeSlot("Second (copy)", [{ name: "B" }]),
    ];
    const result = dedupeWorkoutsByContent(slots);
    expect(result).toHaveLength(3);
    expect(result.map((s) => s.label)).toEqual(["First", "Second", "Third"]);
  });

  it("(e) whitespace/case-only differences in exercise names count as identical", () => {
    const slots = [
      makeSlot("Workout A", [{ name: "  Barbell  Back  Squat  " }, { name: "DB PRESS" }]),
      makeSlot("Workout A - Copy", [{ name: "barbell back squat" }, { name: "db press" }]),
    ];
    const result = dedupeWorkoutsByContent(slots);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Workout A");
  });

  it("preserves section structure (warmup, superset, cooldown) in key", () => {
    const slotA = makeMultiSectionSlot("Workout A", [
      { kind: "warmup", exercises: [{ name: "Row" }] },
      { kind: "straight", exercises: [{ name: "Squat" }] },
      { kind: "cooldown", exercises: [{ name: "Stretch" }] },
    ]);
    const slotB = makeMultiSectionSlot("Workout A - Copy", [
      { kind: "warmup", exercises: [{ name: "Row" }] },
      { kind: "straight", exercises: [{ name: "Squat" }] },
      // Missing cooldown → different content
    ]);
    const result = dedupeWorkoutsByContent([slotA, slotB]);
    expect(result).toHaveLength(2);
  });

  it("different sets/reps produce different keys", () => {
    const slots = [
      makeSlot("Workout A", [{ name: "Squat", sets: 3, reps: "10" }]),
      makeSlot("Workout A - Copy", [{ name: "Squat", sets: 4, reps: "8" }]),
    ];
    const result = dedupeWorkoutsByContent(slots);
    expect(result).toHaveLength(2);
  });

  it("empty input returns empty array", () => {
    expect(dedupeWorkoutsByContent([])).toEqual([]);
  });

  it("single slot passes through unchanged", () => {
    const slot = makeSlot("Solo", [{ name: "Bench" }]);
    expect(dedupeWorkoutsByContent([slot])).toEqual([slot]);
  });

  it("multiple copies of the same content all collapse to one", () => {
    const slots = [
      makeSlot("Workout A", [{ name: "Squat" }]),
      makeSlot("Workout A - Copy", [{ name: "Squat" }]),
      makeSlot("Workout A (copy 2)", [{ name: "Squat" }]),
      makeSlot("Workout A - Copy 3", [{ name: "Squat" }]),
    ];
    const result = dedupeWorkoutsByContent(slots);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Workout A");
  });
});
