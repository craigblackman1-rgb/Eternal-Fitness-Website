import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { ClientProfile, Session, Archetype, Phase } from "@/types";

const archetypeOrder: Archetype[] = ["A", "B", "C"];
const weekPhases: { week: number; phase: Phase }[] = [
  { week: 1, phase: "foundation" },
  { week: 2, phase: "foundation" },
  { week: 3, phase: "build" },
  { week: 4, phase: "develop" },
  { week: 5, phase: "peak" },
  { week: 6, phase: "deload" },
];

const archetypeLabels: Record<Archetype, string> = {
  A: "Today is about how your body moves — joint health, range, and control",
  B: "Today is about building a stronger you — load, tension, and control under resistance",
  C: "Today is about energy — moving with intent, elevating heart rate, and building capacity",
};

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

  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const profile = client.profile as ClientProfile;

  const { data: existingBlocks } = await supabase
    .from("blocks")
    .select("block_number")
    .eq("client_id", clientId)
    .order("block_number", { ascending: false })
    .limit(1);

  const blockNumber = (existingBlocks?.[0]?.block_number ?? 0) + 1;

  let sessions: Session[];

  if (process.env.ANTHROPIC_API_KEY) {
    sessions = await generateViaClaude(profile, blockNote, previousSummary);
  } else {
    sessions = generateFallback(profile, blockNumber);
  }

  const { data: block, error: blockError } = await supabase
    .from("blocks")
    .insert({
      client_id: clientId,
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

async function generateViaClaude(
  profile: ClientProfile,
  blockNote?: string,
  previousSummary?: string
): Promise<Session[]> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const system = `You are an expert exercise physiologist supporting Esther Fair, a Level 4 Personal Trainer
specialising in cancer rehabilitation, exercise referral, adaptive training, and complex health needs.

Your output will be reviewed by Esther before any client sees it. Generate safe, clinically-aware
sessions. Every exercise must include a modification specific to this client's contraindications.
Never exceed the client's implied intensity ceiling based on their conditions and fitness level.
Flag anything Esther should review in a top-level "esther_review_flags" array.

Return valid JSON matching the Session[] schema. No markdown, no preamble, no explanation.`;

  const user = `Generate an 18-session training block for this client:

Client Profile:
${JSON.stringify(profile, null, 2)}

${blockNote ? `Esther's note: ${blockNote}` : ""}
${previousSummary ? `Previous block summary: ${previousSummary}` : ""}

Generate exactly 18 sessions following this structure:
- 6 rounds of ABC (Archetype A = Mobility, B = Strength, C = Conditioning)
- Week 1-2: Foundation, Week 3: Build, Week 4: Develop, Week 5: Peak, Week 6: Deload
- Each session has studio and home versions with warm_up, main_block, cooldown
- Client-facing focus_label per session
- Time tier: ${profile.logistics.time_tier}
- Equipment available: dumbbells, resistance bands, kettlebells, barbell+plates, TRX, stationary bike, treadmill, rowing machine, step/box, mats, foam roller, stability ball

Return only a JSON array of 18 Session objects.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as Session[];
}

function generateFallback(profile: ClientProfile, blockNumber: number): Session[] {
  const sessions: Session[] = [];

  for (let round = 0; round < 6; round++) {
    for (let ai = 0; ai < 3; ai++) {
      const sessionNumber = round * 3 + ai + 1;
      const archetype = archetypeOrder[ai];
      const wp = weekPhases[round];

      sessions.push({
        session_id: `generated-${blockNumber}-${sessionNumber}`,
        block_id: "",
        client_id: profile.client.id,
        session_number: sessionNumber,
        archetype,
        week: wp.week,
        phase: wp.phase,
        focus_label: archetypeLabels[archetype],
        time_tier: profile.logistics.time_tier,
        versions: {
          studio: {
            warm_up: [
              generateExercise("Cat-Cow", archetype, wp.phase),
              generateExercise("Thoracic Rotation", archetype, wp.phase),
            ],
            main_block: [
              generateExercise(archetype === "A" ? "Hip Hinge Pattern" : archetype === "B" ? "Goblet Squat" : "Kettlebell Swing", archetype, wp.phase),
              generateExercise(archetype === "A" ? "World's Greatest Stretch" : archetype === "B" ? "Dumbbell Row" : "Box Step-Up", archetype, wp.phase),
              generateExercise(archetype === "A" ? "Ankle Mobilisation" : archetype === "B" ? "Dumbbell Overhead Press" : "Farmer's Carry", archetype, wp.phase),
            ],
            cooldown: [
              generateExercise("Child's Pose", archetype, wp.phase),
              generateExercise("Figure-4 Stretch", archetype, wp.phase),
            ],
          },
          home: {
            warm_up: [
              generateExercise("Cat-Cow", archetype, wp.phase),
              generateExercise("Thoracic Rotation", archetype, wp.phase),
            ],
            main_block: [
              generateExercise(archetype === "A" ? "Hip Hinge Pattern" : archetype === "B" ? "Bodyweight Squat" : "Band Pull-Apart", archetype, wp.phase),
              generateExercise(archetype === "A" ? "World's Greatest Stretch" : archetype === "B" ? "Band Row" : "Marching Glute Bridge", archetype, wp.phase),
              generateExercise(archetype === "A" ? "Ankle Mobilisation" : archetype === "B" ? "Push-Up" : "Band Walk", archetype, wp.phase),
            ],
            cooldown: [
              generateExercise("Child's Pose", archetype, wp.phase),
              generateExercise("Figure-4 Stretch", archetype, wp.phase),
            ],
          },
        },
        coaching_notes: `Client-specific: ${profile.health.contraindications?.join(", ") || "none noted"}. ${profile.notes.watch_for || ""}`,
        client_intro: archetypeLabels[archetype],
      });
    }
  }

  return sessions;
}

function generateExercise(name: string, _archetype: Archetype, phase: Phase) {
  const sets = phase === "deload" ? 2 : phase === "foundation" ? 3 : phase === "peak" ? 4 : 3;
  const reps = phase === "foundation" ? "10-12" : phase === "deload" ? "8-10" : "8-10";

  return {
    exercise_name: name,
    sets,
    reps,
    tempo: "2-0-2",
    rest: "60 seconds",
    coaching_cue: "Maintain control throughout",
    modification: "Reduce range of motion if needed",
    equipment: [],
  };
}
