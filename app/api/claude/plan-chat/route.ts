import { createClient } from "@/lib/supabase-server";
import { getAiConfig, aiChatStream } from "@/lib/ai-client";
import { readFileSync } from "fs";
import { join } from "path";
import { buildParqSection } from "@/lib/parq-summary";
import { buildRecentUpdatesSection } from "@/lib/recent-updates-summary";
import type { SentUpdate, SignedPARQ } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const PACE_MODE_DESCRIPTIONS: Record<string, { label: string; superset_a: number; superset_b: number; arms_core: number; finisher: boolean; total: number }> = {
  fast:   { label: "Fast",   superset_a: 3, superset_b: 3, arms_core: 3, finisher: true,  total: 10 },
  medium: { label: "Medium", superset_a: 3, superset_b: 2, arms_core: 2, finisher: true,  total: 8  },
  slow:   { label: "Slow",   superset_a: 2, superset_b: 2, arms_core: 2, finisher: false, total: 6  },
};

function buildSystemPrompt(
  client: Record<string, unknown>,
  blocks: Record<string, unknown>[],
  parq: SignedPARQ | null,
  recentUpdates: SentUpdate[],
): string {
  const profile = client.profile as Record<string, unknown>;
  const health = profile?.health as { parq_trainer_override?: boolean; parq_trainer_override_note?: string } | undefined;
  const parqOverride = health?.parq_trainer_override
    ? { confirmed: true, note: health.parq_trainer_override_note }
    : undefined;
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

  const adaptations = (profile?.programming_adaptations as string[]) ?? [];
  const adaptationsText = adaptations.length > 0
    ? adaptations.map((a) => `- ${a}`).join("\n")
    : "None recorded.";

  const contraindications = ((profile?.health as { contraindications?: string[] })?.contraindications) ?? [];
  const contraindicationsText = contraindications.length > 0
    ? contraindications.map((c) => `- ${c}`).join("\n")
    : "None recorded.";

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

---

HARD CONSTRAINTS FOR THIS CLIENT — non-negotiable, check every exercise against this list before including it:
${adaptationsText}

CONTRAINDICATIONS — never programme these:
${contraindicationsText}

These come directly from Esther's notes on this specific client. If an exercise conflicts with anything above,
do not include it — find an alternative that respects the constraint. Do not ask Esther to repeat these; they
are already known.

OUTSTANDING ACTIONS:
${actionsText}

CLIENT PROFILE:
${JSON.stringify(profile, null, 2)}

BLOCK HISTORY:
${blockHistory}

---

PAR-Q SCREENING:
${buildParqSection(parq, parqOverride)}

---

RECENT CLIENT UPDATES (already communicated to this client — don't repeat, build on it):
${buildRecentUpdatesSection(recentUpdates)}

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
- "Full body" means every one of these muscle groups is directly targeted at least once across the block's
  session set (a session doesn't need all of them, but the block does): quads, hamstrings, glutes, back,
  chest, biceps, triceps, shoulders, core. A compound lift may cover more than one group, but every group
  must be traceable to at least one exercise — a plan with zero chest or zero quad work is not full body
  and must not be produced.
- Each of the 3 sessions must feel genuinely different (different warm-ups, finishers, main work)
- No novelty exercise repeats across the 3 sessions (compound lifts are fine to repeat)
- Check equipment conflicts — don't pair exercises that use the same barbell
- Landmine exercises: flag custom video needs
- Mobility in rest periods: 1–2 dynamic drills per superset, relevant to joints being loaded
- Build gym version first; note home alternatives where relevant
- Only use equipment listed in STUDIO EQUIPMENT above — do not invent equipment not on that list

TIMING SENSE CHECK:
- Would Esther get through this in 60 min at this client's pace?
- Total exercises: ${pace.total} (not including warm-up and cooldown)

AFTER BUILDING — do not output the plan until you've verified all of these:
- Muscle-group audit: list which exercise covers each of quads / hamstrings / glutes / back / chest /
  biceps / triceps / shoulders / core. If any group has no exercise, go back and add one before responding.
- Re-read HARD CONSTRAINTS FOR THIS CLIENT above and confirm nothing you've included conflicts with it
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
- If clearance is pending, label the plan DRAFT — PENDING CLEARANCE
- If there is no PAR-Q on file and no trainer override recorded above, refuse to produce a full plan — tell Esther it must be completed first

FORMATTING:
Your replies render as markdown. Structure every plan with ## session headings, and present exercises
as markdown tables with columns: Exercise | Sets | Reps | Tempo | Rest | Modification. Use bullet
lists for rationale and flags, bold for key clinical cautions. Never return one unstructured block of prose.`;
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

  const { data: parq } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: recentUpdates } = await supabase
    .from("sent_updates")
    .select("*")
    .eq("client_id", client.id)
    .order("sent_at", { ascending: false })
    .limit(2);

  const systemPrompt = buildSystemPrompt(client, blocks ?? [], parq, recentUpdates ?? []);

  let readable: ReadableStream<Uint8Array> | null;
  try {
    readable = await aiChatStream({
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: 8000,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 300) : "unknown error";
    console.error(`[plan-chat] AI stream failed via ${aiConfig.provider} (${aiConfig.model}): ${detail}`);
    return new Response(`Plan Agent failed via ${aiConfig.provider} (${aiConfig.model}): ${detail}`, { status: 502 });
  }

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
