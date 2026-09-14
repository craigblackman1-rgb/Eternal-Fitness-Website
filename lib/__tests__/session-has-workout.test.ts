import { describe, it, expect } from "vitest";
import { sessionHasWorkout } from "@/lib/session-display";

/**
 * BUG-EF-145 — sessionHasWorkout is the single source of truth for
 * "does this session have a workout applied?" Used by both the Training
 * table (TrainingSection) and the Manage training drawer (TrainingDrawer)
 * so they always agree.
 *
 * Decision: a Trainerize-imported session that resolves to a programme
 * slot with exercises IS a workout (the import is real content, now
 * deduped by BUG-EF-139). Outlook placeholders and sessions whose data
 * has no exercises remain "nothing applied".
 */

function makeSession(overrides: {
  archetype?: string | null;
  week?: number | null;
  phase?: string | null;
  program_slot_id?: string | null;
  data?: {
    focus_label?: string;
    coaching_notes?: string;
    versions?: {
      studio?: { warm_up?: unknown[]; main_block?: unknown[]; cooldown?: unknown[] };
      home?: { warm_up?: unknown[]; main_block?: unknown[]; cooldown?: unknown[] };
    };
  };
} = {}) {
  return {
    archetype: overrides.archetype ?? null,
    week: overrides.week ?? null,
    phase: overrides.phase ?? null,
    program_slot_id: overrides.program_slot_id ?? null,
    data: overrides.data ?? {},
  };
}

function makeSlot(id = "slot-1") {
  return { id };
}

describe("sessionHasWorkout", () => {
  it("returns false for an Outlook placeholder", () => {
    const session = makeSession({
      data: {
        focus_label: "Outlook booking — client session",
        versions: {
          studio: { warm_up: [], main_block: [], cooldown: [] },
          home: { warm_up: [], main_block: [], cooldown: [] },
        },
      },
    });
    expect(sessionHasWorkout(session)).toBe(false);
  });

  it("returns false when exercises are empty (no version data)", () => {
    const session = makeSession({
      archetype: "strength",
      data: {
        versions: {
          studio: { warm_up: [], main_block: [], cooldown: [] },
          home: { warm_up: [], main_block: [], cooldown: [] },
        },
      },
    });
    expect(sessionHasWorkout(session)).toBe(false);
  });

  it("returns false when exercises are empty (undefined versions)", () => {
    const session = makeSession({
      archetype: "strength",
      data: {},
    });
    expect(sessionHasWorkout(session)).toBe(false);
  });

  it("returns true for a normal session with exercises", () => {
    const session = makeSession({
      archetype: "strength",
      data: {
        focus_label: "Upper body strength",
        versions: {
          studio: {
            warm_up: [{ id: "ex1" }],
            main_block: [{ id: "ex2" }, { id: "ex3" }],
            cooldown: [],
          },
          home: { warm_up: [], main_block: [], cooldown: [] },
        },
      },
    });
    expect(sessionHasWorkout(session)).toBe(true);
  });

  it("returns true for a Trainerize import with a slot and exercises", () => {
    const session = makeSession({
      program_slot_id: "slot-1",
      week: 2,
      data: {
        focus_label: "Workout A",
        coaching_notes: "Imported from Trainerize — original programme retained",
        versions: {
          studio: {
            warm_up: [],
            main_block: [{ id: "ex1" }],
            cooldown: [],
          },
          home: { warm_up: [], main_block: [], cooldown: [] },
        },
      },
    });
    const slot = makeSlot("slot-1");
    expect(sessionHasWorkout(session, slot)).toBe(true);
  });

  it("returns false for a Trainerize import with no slot (no exercises either)", () => {
    const session = makeSession({
      data: {
        coaching_notes: "Imported from Trainerize — original programme retained",
        versions: {
          studio: { warm_up: [], main_block: [], cooldown: [] },
          home: { warm_up: [], main_block: [], cooldown: [] },
        },
      },
    });
    expect(sessionHasWorkout(session)).toBe(false);
  });

  it("returns false for a Trainerize import with slot but no exercises", () => {
    const session = makeSession({
      program_slot_id: "slot-1",
      week: 1,
      data: {
        coaching_notes: "Imported from Trainerize — original programme retained",
        versions: {
          studio: { warm_up: [], main_block: [], cooldown: [] },
          home: { warm_up: [], main_block: [], cooldown: [] },
        },
      },
    });
    const slot = makeSlot("slot-1");
    expect(sessionHasWorkout(session, slot)).toBe(false);
  });

  it("returns true when program_slot_id is on the session (no slot arg needed)", () => {
    const session = makeSession({
      program_slot_id: "slot-1",
      week: 1,
      data: {
        versions: {
          studio: { warm_up: [{ id: "ex1" }], main_block: [], cooldown: [] },
          home: { warm_up: [], main_block: [], cooldown: [] },
        },
      },
    });
    expect(sessionHasWorkout(session)).toBe(true);
  });

  it("returns true for an Outlook placeholder that has exercises (real content overrides placeholder)", () => {
    const session = makeSession({
      data: {
        focus_label: "Outlook booking — team meeting",
        versions: {
          studio: { warm_up: [{ id: "ex1" }], main_block: [], cooldown: [] },
          home: { warm_up: [], main_block: [], cooldown: [] },
        },
      },
    });
    expect(sessionHasWorkout(session)).toBe(true);
  });
});
