import { createClient } from "@/lib/supabase-server";
import { getAiConfig, aiChatStream } from "@/lib/ai-client";
import { readFileSync } from "fs";
import { join } from "path";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const PACE_MODE_DESCRIPTIONS: Record<string, { label: string; superset_a: number; superset_b: number; arms_core: number; finisher: boolean; total: number }> = {
  fast:   { label: "Fast",   superset_a: 3, superset_b: 3, arms_core: 3, finisher: true,  total: 10 },
  medium: { label: "Medium", superset_a: 3, superset_b: 2, arms_core: 2, finisher: true,  total: 8  },
  slow:   { label: "Slow",   superset_a: 2, superset_b: 2, arms_core: 2, finisher: false, total: 6  },
};

function buildSystemPrompt(client: Record<string, unknown>, blocks: Record<string, unknown>[]): string {
  const profile = client.profile as Record<string, unknown>;
  const pace = PACE_MODE_DESCRIPTIONS[(client.pace_mode as string) ?? "medium"];

  let equipment: Record<string, unknown> = { gym: [], space_constraints: "", custom_video_needed: [] };
  let sessionStructure: Record<string, unknown> = {};
  try {
    const dataDir = join(process.cwd(), "data");
    equipment = JSON.parse(readFileSync(join(dataDir, "equipment.json"), "utf-8"));
    sessionStructure = JSON.parse(readFileSync(join(dataDir, "session-structure.json"), "utf-8"));
  } catch {
    // data files missing — continue with empty context
  }

  const equipmentList = (equipment.gym as Array<{ name: string; detail?: string }>)
    ?.map((e) => `- ${e.name}${e.detail ? ` (${e.detail})` : ""}`)
    .join("\n") ?? "";

  const customVideoList = (equipment.custom_video_needed as string[])
    ?.map((v) => `- ${v}`)
    .join("\n") ?? "";

  const blockHistory = blocks.length > 0
    ? blocks.map((b) => `Block ${b.block_number}: ${b.block_note ?? "No note"} [Status: ${b.status}]`).join("\n")
    : "No previous blocks.";

  const outstandingActions = ((client.outstanding_actions as string[]) ?? []);
  const actionsText = outstandingActions.length > 0
    ? outstandingActions.map((a) => `- ${a}`).join("\n")
    : "None.";

  return `You are Esther Fair's programming assistant. Esther is a Level 4 Personal Trainer specialising in cancer rehabilitation, exercise referral, adaptive training, and complex health needs.

Your role is to help Esther plan training blocks through conversation. You know this client's full profile, health history, programming history, and constraints. You follow Esther's 60-minute session structure and build principles. Esther reviews and approves all plans — you generate, she decides.

---

CLIENT: ${client.name}
COMPLIANCE STATUS: ${client.compliance_status ?? "unknown"}
GROUP TYPE: ${client.group_type === "calendar_block" ? "Calendar Block (shared programme)" : "Individual Journey (bespoke)"}
PACE MODE: ${pace.label} — ~${pace.total} work exercises per session
  Superset A: ${pace.superset_a} exercises
  Superset B: ${pace.superset_b} exercises
  Arms + Core: ${pace.arms_core} exercises
  Finisher: ${pace.finisher ? "Yes (5 min)" : "No — this client does not get a finisher"}

OUTSTANDING ACTIONS:
${actionsText}

CLIENT PROFILE:
${JSON.stringify(profile, null, 2)}

BLOCK HISTORY:
${blockHistory}

---

STUDIO EQUIPMENT:
${equipmentList}

Space: ${equipment.space_constraints ?? ""}

CUSTOM VIDEOS NEEDED IN TRAINERIZE (flag if using any of these):
${customVideoList}

---

60-MINUTE SESSION STRUCTURE:
Warm-up & Activation — 10 min, 2 sets, flow through, no rest
Hypertrophy Superset A — 15 min, ${pace.superset_a} exercises, 2 sets, 60–75s rest. Mobility drill in rest period.
Hypertrophy Superset B — 15 min, ${pace.superset_b} exercises, 2 sets, 60–75s rest. Mobility drill in rest period.
Arms + Core — 12 min, ${pace.arms_core} exercises, 2 sets, 60s rest between sets, flow through exercises.
${pace.finisher ? "Conditioning Finisher — 5 min, one focused effort. Battle rope / KB complex / loaded carry. Must differ across all 3 sessions." : "No finisher for this client — pace mode is Slow."}
Buffer — 5 min for setup, transitions, coaching cues. Always account for this.

LOADING PRINCIPLES:
- 8–12 reps for compound movements
- 10–15 reps for accessory and isolation
- 2–4 second eccentric (lowering phase)
- 2 sets across all blocks
- Progress load only when form is perfect
- Mobility sits inside the rest period, not between exercises within a superset
- Dynamic drills only mid-session — no static holds over 15 seconds

---

BUILD CHECKLIST — work through this before producing a plan:

BEFORE BUILDING:
- Review block history — what was the last focus? What comes next logically?
- Has anything changed in this client's health or circumstances?
- Check outstanding actions — do any affect programming?
- Confirm paperwork is in order before programming

BUILDING SESSIONS:
- Every session must be full body: push, pull, hinge, squat, core
- Each of the 3 sessions must feel genuinely different (different warm-ups, finishers, main work)
- No novelty exercise repeats across the 3 sessions (compound lifts are fine to repeat)
- Check equipment conflicts — don't pair exercises that use the same barbell
- Landmine exercises: flag custom video needs
- Mobility in rest periods: 1–2 dynamic drills per superset, relevant to joints being loaded
- Build gym version first; note home alternatives where relevant

TIMING SENSE CHECK:
- Would Esther get through this in 60 min at this client's pace?
- Total exercises: ${pace.total} (not including warm-up and cooldown)

AFTER BUILDING:
- Sense check: do all 3 sessions feel genuinely different?
- Note any Trainerize custom video requirements
- Flag anything for Esther's clinical review

---

SAFETY RULES — never violate:
- Never programme exercises requiring equipment not confirmed in the studio
- Never exceed the client's intensity ceiling
- Every exercise must have a documented modification
- Never mark a plan as approved — that is Esther's action only
- Cancer-related fatigue is not training fatigue — default to lower volume
- If lymphoedema risk is present, flag any compression or sustained upper limb loading
- If BP monitoring required, flag exercises that cause Valsalva
- If clearance is pending, label the plan DRAFT — PENDING CLEARANCE`;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { clientNumber, messages } = await request.json() as { clientNumber: number; messages: ChatMessage[] };

  if (!clientNumber || !messages) {
    return new Response("clientNumber and messages are required", { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("*, compliance_status, outstanding_actions, group_type, pace_mode")
    .eq("client_number", clientNumber)
    .single();

  if (!client) {
    return new Response("Client not found", { status: 404 });
  }

  const aiConfig = getAiConfig();
  if (!aiConfig.provider) {
    return new Response("Plan Agent is not configured — set OPENROUTER_API_KEY or ANTHROPIC_API_KEY", { status: 503 });
  }

  const { data: blocks } = await supabase
    .from("blocks")
    .select("block_number, block_note, status, created_at")
    .eq("client_id", client.id)
    .order("block_number", { ascending: false })
    .limit(5);

  const systemPrompt = buildSystemPrompt(client, blocks ?? []);

  const readable = await aiChatStream({
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    maxTokens: 8000,
  });

  if (!readable) {
    return new Response("Plan Agent is not configured", { status: 503 });
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
