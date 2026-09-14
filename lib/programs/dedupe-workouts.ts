/**
 * Content-based workout deduplication — BUG-EF-139.
 *
 * Trainerize exports often contain duplicate workouts (e.g. "Workout A" and
 * "Workout A - Copy") where the copies may or may not differ in content. The
 * old name-based dedupe collapsed genuinely distinct workouts that shared a
 * name and kept Copy duplicates that had no meaningful differences.
 *
 * This module replaces name-based dedupe with content-based dedupe:
 *   1. Compute a stable content key from the ordered exercise list + all
 *      prescription fields (sets, reps, weight, duration, notes, per_side).
 *   2. Group by key — workouts with identical content collapse to one entry.
 *   3. Per group, prefer the entry whose name does NOT end in a Copy suffix.
 *   4. Preserve original input order of the kept entries.
 *
 * Distinct content with the same label is preserved — the DB has no
 * label-uniqueness constraint (UNIQUE is on program_id + position).
 */

import type { ParsedSlot } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Normalisation helpers
// ─────────────────────────────────────────────────────────────────────

/** Collapse whitespace, trim, lowercase — stable across formatting noise. */
function norm(s: string | undefined | null): string {
  return (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Normalise a single exercise into a deterministic key fragment. */
function exerciseKey(ex: ParsedSlot["data"]["sections"][0]["exercises"][0]): string {
  return [
    norm(ex.exercise_name),
    norm(ex.per_side),
    ex.sets ?? "",
    norm(ex.reps),
    norm(ex.weight),
    norm(ex.duration),
    norm(ex.notes),
  ].join("|");
}

/** Normalise a section into a deterministic key fragment. */
function sectionKey(section: ParsedSlot["data"]["sections"][0]): string {
  const exKeys = section.exercises.map(exerciseKey).join(";");
  return [section.kind, norm(section.label), section.rounds ?? "", norm(section.rest), exKeys].join("~");
}

/** Build a stable content key for an entire workout slot. */
function contentKey(slot: ParsedSlot): string {
  return slot.data.sections.map(sectionKey).join("||");
}

// ─────────────────────────────────────────────────────────────────────
// Copy-suffix detection
// ─────────────────────────────────────────────────────────────────────

const COPY_RE = /\s*[-(]?\s*copy\s*\d*\)?$/i;

function isCopyName(label: string): boolean {
  return COPY_RE.test(label);
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

/**
 * Deduplicate an ordered list of parsed workout slots by content.
 *
 * Returns a new array containing every distinct workout (by exercise content).
 * When two or more slots share a content key, the one whose label does NOT
 * match the Copy suffix regex is kept; otherwise the first is kept.
 * Original input order is preserved.
 */
export function dedupeWorkoutsByContent<T extends ParsedSlot>(slots: T[]): T[] {
  // Map from content key → first slot seen (the canonical survivor)
  const byKey = new Map<string, T>();
  // Track which keys have a non-copy name, so we can swap if a copy arrives first
  const hasNonCopy = new Set<string>();

  for (const slot of slots) {
    const key = contentKey(slot);

    if (!byKey.has(key)) {
      // First slot with this content — tentatively keep it
      byKey.set(key, slot);
      if (!isCopyName(slot.label)) {
        hasNonCopy.add(key);
      }
    } else if (!isCopyName(slot.label)) {
      // Duplicate content, but THIS slot has a non-copy name and the existing
      // one might be a copy — replace it
      if (!hasNonCopy.has(key)) {
        byKey.set(key, slot);
        hasNonCopy.add(key);
      }
      // If both are non-copy, keep the first (original order)
    }
    // If this is a copy and we already have a survivor, skip it
  }

  // Build result preserving the order of first appearance of each surviving key
  const result: T[] = [];
  for (const slot of slots) {
    const key = contentKey(slot);
    if (byKey.get(key) === slot) {
      result.push(slot);
    }
  }

  return result;
}
