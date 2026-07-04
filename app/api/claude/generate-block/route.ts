import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAiConfig, aiChat } from "@/lib/ai-client";
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

  const { clientId, blockNote, previousSummary } = await request.json();

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

async function generateViaAi(
  profile: ClientProfile,
  blockNote?: string,
  previousSummary?: string,
  _blockNumber?: number
): Promise<Session[]> {
  const spw = profile.logistics.sessions_per_week;
  const totalSessions = spw * 6;

  const sessionDistribution = weekPhases.map((wp, wi) => {
    const start = wi * spw + 1;
    const end = (wi + 1) * spw;
    return `Sessions ${start}-${end}: Week ${wp.week} (${wp.phase})`;
  }).join("\n");

  const system = `You are an expert exercise physiologist supporting Esther Fair, a Level 4 Personal Trainer
specialising in cancer rehabilitation, exercise referral, adaptive training, and complex health needs.

Your output will be reviewed by Esther before any client sees it. Generate safe, clinically-aware
sessions. Every exercise must include a modification specific to this client's contraindications.
Never exceed the client's implied intensity ceiling based on their conditions and fitness level.
Flag anything Esther should review in a top-level "esther_review_flags" array.

Return valid JSON matching the Session[] schema. No markdown, no preamble, no explanation.`;

  const user = `Generate a ${totalSessions}-session training block for this client over 6 weeks:

Client Profile:
${JSON.stringify(profile, null, 2)}

${blockNote ? `Esther's note: ${blockNote}` : ""}
${previousSummary ? `Previous block summary: ${previousSummary}` : ""}

FREQUENCY: ${spw}x/week (${totalSessions} sessions total)

SESSION DISTRIBUTION:
${sessionDistribution}

Each session has an archetype: A (Mobility & Movement Quality), B (Strength & Stability), or C (Power & Conditioning).
Assign archetypes dynamically based on this client's goals and needs — do not use a fixed rotation.
Ensure each archetype appears roughly evenly across the block.

Each session has studio and home versions with warm_up, main_block, cooldown.
Time tier: ${profile.logistics.time_tier}
Equipment: dumbbells, resistance bands, kettlebells, barbell+plates, TRX, stationary bike, treadmill, rowing machine, step/box, mats, foam roller, stability ball

MAIN BLOCK STRUCTURE (Esther's 60-minute session format — follow exactly):
Every exercise in main_block MUST carry a "group_label" field structuring the session:
- "Superset A" — first hypertrophy pairing (2-3 exercises performed as a superset, 60-75s rest, mobility drill in the rest period)
- "Superset B" — second hypertrophy pairing (2-3 exercises, same pattern)
- "Arms + Core" — 2-3 accessory exercises, 60s rest, flow through
- "Finisher" — one focused 5-min conditioning effort (battle rope / KB complex / loaded carry); omit for slow-pace clients
Exercises within the same group_label are performed together as a superset/circuit. warm_up and cooldown
exercises do not need group_label. Do not invent other group_label values.

PROGRESSION RULES:
- Foundation (weeks 1-2): basic regressions, learn patterns, low load, lower ROM
- Build (week 3): increase load, add complexity to established patterns
- Develop (week 4): compound movements, greater ROM, higher challenge
- Peak (week 5): highest intensity/volume of the block
- Deload (week 6): drop volume, submax loads, active recovery focus, easier exercises

Return only a JSON array of ${totalSessions} Session objects.`;

  const text = await aiChat({ system, user, maxTokens: 16000 });
  if (!text) throw new Error("AI returned no response");

  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned) as Session[];
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


