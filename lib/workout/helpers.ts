import { fromKg } from "@/lib/units";

/** Section key used across the session logger surfaces. */
export type SectionKey = "warm_up" | "main_block" | "cooldown";

/** Section definitions with labels and colour tokens for the UI. */
export const SECTION_DEFS: { key: SectionKey; label: string; color: "teal" | "rose" | "navy" }[] = [
  { key: "warm_up", label: "Warm-up", color: "teal" },
  { key: "main_block", label: "Main Block", color: "rose" },
  { key: "cooldown", label: "Cooldown", color: "navy" },
];

/** Round a converted weight to 1 decimal and trim trailing .0 for display. */
export function displayWeight(kg: number, unit: "kg" | "lb"): string {
  const v = Math.round(fromKg(kg, unit) * 10) / 10;
  return String(v);
}

/** Build a unique key for an exercise within a version/section/index. */
export function exerciseRefKey(version: string, section: SectionKey, index: number, name: string): string {
  return `${version}:${section}:${index}:${name}`;
}

/** Format a signed total of seconds as mm:ss. */
export function mmss(total: number): string {
  const m = Math.floor(Math.abs(total) / 60);
  const s = Math.abs(total) % 60;
  return (total < 0 ? "+" : "") + m + ":" + String(s).padStart(2, "0");
}
