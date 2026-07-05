import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAiConfig, aiChat } from "@/lib/ai-client";
import { safeRequestJson } from "@/lib/safe-request-json";
import type { ClientProfile, Session, Archetype, Phase, Exercise, SessionVersion } from "@/types";

const weekPhases: { week: number; phase: Phase }[] = [
  { week: 1, phase: "foundation" },
  { week: 2, phase: "foundation" },
  { week: 3, phase: "build" },
  { week: 4, phase: "develop" },
  { week: 5, phase: "peak" },
  { week: 6, phase: "deload" },
];

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await safeRequestJson<{ clientId?: string; blockNote?: string; previousSummary?: string }>(request);
  if ("error" in parsed) return parsed.error;
  const { clientId, blockNote, previousSummary } = parsed.data;

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const { data: client } = await supabase.from("clients").select("*").eq("client_number", parseInt(clientId)).single();
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const profile = (client.profile as unknown) as ClientProfile;
  if (!profile || !profile.logistics) {
    return NextResponse.json({ error: "Client profile is incomplete" }, { status: 400 });
  }

  const { data: existingBlocks } = await supabase
    .from("blocks")
    .select("block_number")
    .eq("client_id", client.id)
    .order("block_number", { ascending: false })
    .limit(1);

  const blockNumber = (existingBlocks?.[0]?.block_number ?? 0) + 1;

  const aiConfig = getAiConfig();
  let sessions: Session[];

  if (aiConfig.provider) {
    try {
      sessions = await generateViaAi(profile, blockNote, previousSummary, blockNumber);
    } catch (err) {
      const detail = err instanceof Error ? err.message.slice(0, 300) : "unknown error";
      console.error(`[generate-block] AI generation failed via ${aiConfig.provider} (${aiConfig.model}): ${detail}`);
      return NextResponse.json(
        { error: `AI generation failed via ${aiConfig.provider} (${aiConfig.model}): ${detail}` },
        { status: 502 },
      );
    }
  } else {
    sessions = generateFallback(profile, blockNumber);
  }

  const invalid =
    !Array.isArray(sessions) ||
    sessions.length === 0 ||
    sessions.some(
      (s) =>
        !s?.session_number ||
        !s?.versions?.studio?.main_block?.length ||
        !s?.versions?.home?.main_block?.length,
    );
  if (invalid) {
    console.error(
      `[generate-block] rejected invalid session plan (provider=${aiConfig.provider ?? "fallback"}, count=${Array.isArray(sessions) ? sessions.length : "not-array"}) — no block created`,
    );
    return NextResponse.json(
      { error: "Generation produced an invalid or empty session plan — no block was created. Try again; if this persists the AI provider is misconfigured or underpowered." },
      { status: 502 },
    );
  }

  const { data: block, error: blockError } = await supabase
    .from("blocks")
    .insert({
      client_id: client.id,
      block_number: blockNumber,
      status: "draft",
      block_note: blockNote || null,
    })
    .select()
    .single();

  if (blockError) {
    return NextResponse.json({ error: blockError.message }, { status: 500 });
  }

  const sessionRows = sessions.map((session) => ({
    block_id: block.id,
    session_number: session.session_number,
    archetype: session.archetype,
    week: session.week,
    phase: session.phase,
    data: session,
  }));

  const { error: sessionsError } = await supabase.from("sessions").insert(sessionRows);

  if (sessionsError) {
    await supabase.from("blocks").delete().eq("id", block.id);
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  return NextResponse.json({ blockId: block.id }, { status: 201 });
}

/** Model for plan generation. A full 6-week block is far too large to return in
 *  one response (~5k output tokens *per session*), so we generate one session
 *  per call and assemble. That keeps each response small enough to parse
 *  reliably and lets us retry individual sessions. Overridable via PLAN_MODEL;
 *  Haiku is capable enough for structured session JSON and ~10x cheaper. */
const PLAN_MODEL = process.env.PLAN_MODEL || "anthropic/claude-haiku-4.5";

const archetypeFocusLabels: Record<Archetype, string> = {
  A: "Mobility & Movement Quality",
  B: "Strength & Stability",
  C: "Power & Conditioning",
};

interface SessionSlot {
  session_number: number;
  week: number;
  phase: Phase;
  archetype: Archetype;
}

/** Build the ordered list of sessions with a pre-assigned, evenly-distributed
 *  archetype per slot (reusing the goal-biased rotation the fallback uses). */
function buildSessionSlots(profile: ClientProfile): SessionSlot[] {
  const spw = profile.logistics.sessions_per_week;
  const slots: SessionSlot[] = [];
  let n = 0;
  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const wp = weekPhases[weekIndex];
    const archetypes = getWeeklyArchetypes(spw, weekIndex, profile.goals.primary);
    for (const archetype of archetypes) {
      n++;
      slots.push({ session_number: n, week: wp.week, phase: wp.phase, archetype });
    }
  }
  return slots;
}

async function generateViaAi(
  profile: ClientProfile,
  blockNote?: string,
  previousSummary?: string,
  _blockNumber?: number
): Promise<Session[]> {
  const slots = buildSessionSlots(profile);

  // Generate sessions concurrently — one call each — so the route completes
  // well within serverless limits even for a full 3x/week block (18 calls).
  const settled = await Promise.allSettled(
    slots.map((slot) => generateOneSession(profile, slot, blockNote, previousSummary)),
  );

  const sessions: Session[] = [];
  const failures: string[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      sessions.push(result.value);
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : "unknown";
      failures.push(`session ${slots[i].session_number}: ${reason}`);
    }
  });

  if (failures.length > 0) {
    throw new Error(`${failures.length}/${slots.length} sessions failed — ${failures.slice(0, 3).join("; ")}`);
  }

  sessions.sort((a, b) => a.session_number - b.session_number);
  return sessions;
}

const planSystem = `You are an expert exercise physiologist supporting Esther Fair, a Level 4 Personal Trainer
specialising in cancer rehabilitation, exercise referral, adaptive training, and complex health needs.

Your output will be reviewed by Esther before any client sees it. Generate safe, clinically-aware
sessions. Every exercise must include a modification specific to this client's contraindications.
Never exceed the client's implied intensity ceiling based on their conditions and fitness level.

Return one valid JSON object matching the Session schema. No markdown, no preamble, no explanation.`;

function sessionPrompt(
  profile: ClientProfile,
  slot: SessionSlot,
  blockNote?: string,
  previousSummary?: string,
): string {
  const phaseGuidance: Record<Phase, string> = {
    foundation: "basic regressions, learn patterns, low load, lower ROM",
    build: "increase load, add complexity to established patterns",
    develop: "compound movements, greater ROM, higher challenge",
    peak: "highest intensity/volume of the block",
    deload: "drop volume, submax loads, active recovery focus, easier exercises",
  };

  return `Generate ONE training session (number ${slot.session_number} of a 6-week block) for this client:

Client Profile:
${JSON.stringify(profile, null, 2)}

${blockNote ? `Esther's note: ${blockNote}` : ""}
${previousSummary ? `Previous block summary: ${previousSummary}` : ""}

THIS SESSION:
- session_number: ${slot.session_number}
- week: ${slot.week}
- phase: ${slot.phase} (${phaseGuidance[slot.phase]})
- archetype: ${slot.archetype} (${archetypeFocusLabels[slot.archetype]})
- time_tier: ${profile.logistics.time_tier}

Equipment available: dumbbells, resistance bands, kettlebells, barbell+plates, TRX, stationary bike, treadmill, rowing machine, step/box, mats, foam roller, stability ball

Return a single JSON object with this exact shape:
{
  "session_number": ${slot.session_number},
  "archetype": "${slot.archetype}",
  "week": ${slot.week},
  "phase": "${slot.phase}",
  "focus_label": "<short focus label>",
  "versions": {
    "studio": { "warm_up": [Exercise], "main_block": [Exercise], "cooldown": [Exercise] },
    "home":   { "warm_up": [Exercise], "main_block": [Exercise], "cooldown": [Exercise] }
  }
}

Each Exercise is: { "exercise_name", "sets" (number), "reps", "tempo", "rest", "coaching_cue", "modification", "equipment" (string array) }.
Every main_block exercise MUST also carry a "group_label" of exactly one of: "Superset A", "Superset B", "Arms + Core", "Finisher" (warm_up and cooldown do not need group_label). Do not invent other group_label values.
The "home" version must substitute bodyweight/band alternatives where studio equipment is unavailable, keeping every exercise's clinical modification.

Return ONLY the JSON object — no markdown fences, no commentary.`;
}

async function generateOneSession(
  profile: ClientProfile,
  slot: SessionSlot,
  blockNote?: string,
  previousSummary?: string,
): Promise<Session> {
  const user = sessionPrompt(profile, slot, blockNote, previousSummary);

  const text = await aiChat({ system: planSystem, user, model: PLAN_MODEL, maxTokens: 6000 });
  if (!text) throw new Error("AI returned no response");

  let parsed: Partial<Session>;
  try {
    parsed = parseSessionObject(text);
  } catch (firstErr) {
    const detail = firstErr instanceof Error ? firstErr.message : "invalid JSON";
    const repaired = await aiChat({
      system: planSystem,
      messages: [
        { role: "user", content: user },
        { role: "assistant", content: text },
        {
          role: "user",
          content: `That response failed JSON parsing (${detail}). Return the same session as a single valid JSON object. Output ONLY the JSON object — no markdown fences, no commentary, no trailing commas.`,
        },
      ],
      model: PLAN_MODEL,
      maxTokens: 6000,
    });
    if (!repaired) throw firstErr;
    parsed = parseSessionObject(repaired);
  }

  // Stamp the slot metadata authoritatively so numbering/phase never drift.
  return {
    session_id: "",
    block_id: "",
    client_id: profile.client.id,
    session_number: slot.session_number,
    archetype: slot.archetype,
    week: slot.week,
    phase: slot.phase,
    focus_label:
      parsed.focus_label ||
      `${archetypeFocusLabels[slot.archetype]} (Week ${slot.week})`,
    time_tier: profile.logistics.time_tier,
    versions: parsed.versions as Session["versions"],
    coaching_notes: parsed.coaching_notes,
    client_intro: parsed.client_intro ?? archetypeFocusLabels[slot.archetype],
  } as Session;
}

/** Parse a single session object, tolerating markdown fences, surrounding prose,
 *  and trailing commas that otherwise break JSON.parse. */
function parseSessionObject(text: string): Partial<Session> {
  let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  // Slice to the outermost JSON object so leading/trailing prose is ignored.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  let obj: Partial<Session>;
  try {
    obj = JSON.parse(cleaned) as Partial<Session>;
  } catch {
    obj = JSON.parse(cleaned.replace(/,(\s*[}\]])/g, "$1")) as Partial<Session>;
  }

  if (!obj?.versions?.studio?.main_block?.length || !obj?.versions?.home?.main_block?.length) {
    throw new Error("session object missing studio/home main_block");
  }
  return obj;
}

/* ─── Fallback generator powered by exercise-db.json ─── */

import exerciseDb from "@/lib/exercise-db.json";

interface ExerciseDbEntry {
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

const archetypeSectionTypes: Record<Archetype, { warm_up: string[]; main_block: string[]; cooldown: string[] }> = {
  A: {
    warm_up: ["spinal_mobility", "upper_body_mobility", "full_body_mobility"],
    main_block: ["lower_body_mobility", "full_body_mobility", "hinge_pattern"],
    cooldown: ["rest_recovery", "spinal_mobility", "lower_body_mobility"],
  },
  B: {
    warm_up: ["core_anterior", "core_posterior", "core_lateral"],
    main_block: ["squat_pattern", "lunge_pattern", "hinge_pattern", "horizontal_pull", "horizontal_push", "vertical_push", "loaded_carry", "push_accessory", "pull_accessory"],
    cooldown: ["spinal_mobility", "lower_body_mobility", "rest_recovery"],
  },
  C: {
    warm_up: ["mobility_dynamic", "core_posterior", "lateral_movement"],
    main_block: ["hinge_pattern", "power_output", "lateral_movement", "locomotion", "cardio"],
    cooldown: ["lower_body_mobility", "rest_recovery"],
  },
};

function pickExercise(
  pool: ExerciseDbEntry[],
  usedIds: Set<string>,
  allowRepeat: boolean
): ExerciseDbEntry | null {
  const available = pool.filter((e) => allowRepeat || !usedIds.has(e.id));
  if (available.length === 0) return null;
  const pick = available[Math.floor(Math.random() * available.length)];
  usedIds.add(pick.id);
  return pick;
}

function makeExercise(
  entry: ExerciseDbEntry,
  phase: Phase,
  section: "warm_up" | "main_block" | "cooldown"
): Exercise {
  const isDeload = phase === "deload";
  const isFoundation = phase === "foundation";
  const isPeak = phase === "peak";

  let sets: number;
  let reps: string;
  let tempo: string;
  let rest: string;

  if (section === "warm_up") {
    sets = 1; reps = "8-10"; tempo = "slow, controlled"; rest = "none";
  } else if (section === "cooldown") {
    sets = 1; reps = "hold 30-45s"; tempo = "breathe"; rest = "none";
  } else {
    if (isDeload) { sets = 2; reps = "10-12"; tempo = "2-0-2"; rest = "60s"; }
    else if (isFoundation) { sets = 3; reps = "10-12"; tempo = "2-0-2"; rest = "60s"; }
    else if (isPeak) { sets = 4; reps = "6-8"; tempo = "2-0-1"; rest = "90s"; }
    else { sets = 3; reps = "8-10"; tempo = "2-0-2"; rest = "60-75s"; }
  }

  return {
    exercise_name: entry.name,
    sets,
    reps,
    tempo,
    rest,
    coaching_cue: entry.coaching_cue,
    modification: entry.default_mod,
    equipment: entry.equipment,
  };
}

function composeSessionVersion(
  archetype: Archetype,
  phase: Phase,
  usedIds: Set<string>,
  isHome: boolean
): SessionVersion {
  const db = (exerciseDb as { exercises: ExerciseDbEntry[] }).exercises;
  const archetypePool = db.filter((e) => e.archetypes.includes(archetype));

  const sectionTypes = archetypeSectionTypes[archetype];

  function composeSection(section: "warm_up" | "main_block" | "cooldown"): Exercise[] {
    const types = sectionTypes[section];
    const target = section === "main_block" ? 3 : 2;

    const picked: Exercise[] = [];
    const usedInSession = new Set<string>();

    for (let i = 0; i < target && i < types.length; i++) {
      const typePool = archetypePool.filter(
        (e) => e.movement_type === types[i] && !usedIds.has(e.id) && !usedInSession.has(e.id)
      );
      const entry = pickExercise(typePool, usedIds, false);
      if (entry) {
        usedInSession.add(entry.id);
        picked.push(makeExercise(entry, phase, section));
      }
    }

    if (picked.length < target) {
      const remaining = archetypePool.filter(
        (e) => !usedIds.has(e.id) && !usedInSession.has(e.id)
      );
      while (picked.length < target && remaining.length > 0) {
        const entry = pickExercise(remaining, usedIds, false);
        if (!entry) break;
        usedInSession.add(entry.id);
        picked.push(makeExercise(entry, phase, section));
      }
    }

    return picked.length > 0 ? picked : [makeExercise(archetypePool[0], phase, section)];
  }

  const warm_up = composeSection("warm_up");
  const main_block = composeSection("main_block").map((ex, i) => ({
    ...ex,
    group_label: i < 2 ? "Superset A" : "Arms + Core",
  }));
  const cooldown = composeSection("cooldown");

  if (isHome) {
    return {
      warm_up: warm_up.map((ex) => ({
        ...ex,
        modification: `${ex.modification} Do without equipment` + (ex.equipment.length > 0 ? ` (no ${ex.equipment.join("/")})` : ""),
        equipment: [],
        coaching_cue: ex.coaching_cue,
      })),
      main_block: main_block.map((ex) => ({
        ...ex,
        modification: `${ex.modification} Do without equipment` + (ex.equipment.length > 0 ? ` (no ${ex.equipment.join("/")})` : ""),
        equipment: [],
        coaching_cue: ex.coaching_cue,
      })),
      cooldown: cooldown.map((ex) => ({
        ...ex,
        modification: `${ex.modification} Do without equipment` + (ex.equipment.length > 0 ? ` (no ${ex.equipment.join("/")})` : ""),
        equipment: [],
        coaching_cue: ex.coaching_cue,
      })),
    };
  }

  return { warm_up, main_block, cooldown };
}

function getWeeklyArchetypes(spw: number, weekIndex: number, primaryGoal: string): Archetype[] {
  const goalBias: Record<string, Archetype[]> = {
    strength: ["B", "A", "C"],
    mobility: ["A", "B", "C"],
    weight_loss: ["C", "B", "A"],
    rehabilitation: ["A", "C", "B"],
    confidence: ["A", "B", "C"],
    general_fitness: ["A", "B", "C"],
  };

  const bias = goalBias[primaryGoal] || ["A", "B", "C"];

  if (spw === 3) return [bias[0], bias[1], bias[2]];

  if (spw === 2) {
    const a = bias[weekIndex % 3];
    const b = bias[(weekIndex + 1) % 3];
    return [a, b];
  }

  return [bias[weekIndex % 3]];
}

function generateFallback(profile: ClientProfile, blockNumber: number): Session[] {
  const sessions: Session[] = [];
  const usedIds = new Set<string>();
  const spw = profile.logistics.sessions_per_week;
  const primaryGoal = profile.goals.primary;

  const archetypeFocus: Record<Archetype, string> = {
    A: "Mobility & Movement Quality",
    B: "Strength & Stability",
    C: "Power & Conditioning",
  };

  let sessionNumber = 0;

  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const wp = weekPhases[weekIndex];
    const archetypes = getWeeklyArchetypes(spw, weekIndex, primaryGoal);

    const phaseLabel =
      wp.phase === "foundation" ? "Building Foundations"
      : wp.phase === "build" ? "Adding Load"
      : wp.phase === "develop" ? "Increasing Complexity"
      : wp.phase === "peak" ? "Peak Output"
      : "Active Recovery";

    for (const archetype of archetypes) {
      sessionNumber++;

      sessions.push({
        session_id: `generated-${blockNumber}-${sessionNumber}`,
        block_id: "",
        client_id: profile.client.id,
        session_number: sessionNumber,
        archetype,
        week: wp.week,
        phase: wp.phase,
        focus_label: `${archetypeFocus[archetype]} — ${phaseLabel} (Week ${wp.week})`,
        time_tier: profile.logistics.time_tier,
        versions: {
          studio: composeSessionVersion(archetype, wp.phase, usedIds, false),
          home: composeSessionVersion(archetype, wp.phase, usedIds, true),
        },
        coaching_notes: `Client-specific: ${profile.health.contraindications?.join(", ") || "none noted"}. ${profile.notes.watch_for || ""}. Home version substitutes bodyweight for equipment.`,
        client_intro: archetypeFocus[archetype],
      });
    }
  }

  return sessions;
}


