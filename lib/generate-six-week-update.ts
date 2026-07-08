import { createClient } from "@/lib/supabase-server";
import type { DBClient, DBBlock, BlockSummary } from "@/types";
import { buildSixWeekUpdateHtml } from "@/lib/email-templates/six-week-update";
import type { SixWeekUpdateData } from "@/lib/email-templates/six-week-update";
import { getAiConfig, aiChat } from "@/lib/ai-client";

export interface SixWeekUpdateDraft {
  subject: string;
  html: string;
  data: SixWeekUpdateData;
  blockNumber: number;
  generatedAt: string;
  provider: string | null;
}

export async function generateSixWeekUpdate(
  clientNumber: number,
  options: { conversationSummary?: string } = {},
): Promise<SixWeekUpdateDraft> {
  const supabase = createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("client_number", clientNumber)
    .single();

  if (!client) {
    throw new Error("Client not found");
  }

  const dbClient = client as unknown as DBClient;
  const profile = dbClient.profile;

  const { data: completedBlocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("client_id", dbClient.id)
    .in("status", ["complete", "active"])
    .order("block_number", { ascending: false })
    .limit(3);

  const { data: latestPlanned } = await supabase
    .from("blocks")
    .select("*")
    .eq("client_id", dbClient.id)
    .in("status", ["active", "approved", "draft"])
    .order("block_number", { ascending: false })
    .limit(1);

  const blocks = (completedBlocks || []) as DBBlock[];
  const nextBlock = (latestPlanned?.[0] as DBBlock) || null;
  const summaries = (dbClient.block_summaries || []) as BlockSummary[];

  const blockNumber = blocks[0]?.block_number ?? 0;
  const aiConfig = getAiConfig();

  if (aiConfig.provider) {
    return generateViaAi(aiConfig, profile, blocks, summaries, nextBlock, dbClient.name, blockNumber, options.conversationSummary);
  }

  return generateFallback(profile, blocks, summaries, nextBlock, dbClient.name, blockNumber);
}

function buildSections(
  profile: import("@/types").ClientProfile,
  blocks: DBBlock[],
  summaries: BlockSummary[],
  nextBlock: DBBlock | null,
  clientName: string,
): SixWeekUpdateData {
  const latestSummary = summaries[summaries.length - 1];

  // Attendance
  let attendanceSection: string;
  if (latestSummary) {
    const { sessions_attended, sessions_scheduled, attendance_notes } = latestSummary.attendance;
    attendanceSection = `<p>You attended <strong>${sessions_attended}</strong> out of <strong>${sessions_scheduled}</strong> sessions over this block.`;
    if (attendance_notes) attendanceSection += ` ${attendance_notes}`;
    attendanceSection += `</p>`;
  } else {
    attendanceSection = `<p>[ATTENDANCE — add sessions attended / scheduled]</p>`;
  }

  // Highlights
  let highlightsSection: string;
  if (latestSummary?.highlights) {
    highlightsSection = `<p>${latestSummary.highlights}</p>`;
    if (latestSummary.movements_introduced?.length > 0) {
      highlightsSection += `<p>Movements we introduced or progressed:</p><ul style="padding-left:20px;">${latestSummary.movements_introduced.map((m) => `<li style="margin-bottom:4px;">${m}</li>`).join("")}</ul>`;
    }
  } else if (blocks.length > 0) {
    const blockNotes = blocks.filter((b) => b.block_note).map((b) => b.block_note);
    if (blockNotes.length > 0) {
      highlightsSection = `<p>Over this period we worked on:</p><ul style="padding-left:20px;">${blockNotes.map((n) => `<li style="margin-bottom:4px;">${n}</li>`).join("")}</ul>`;
    } else {
      highlightsSection = `<p>[HIGHLIGHTS — describe what's improved, movements added, strength gains]</p>`;
    }
  } else {
    highlightsSection = `<p>[HIGHLIGHTS — describe what's improved, movements added, strength gains]</p>`;
  }

  // The big win this block — the single standout moment worth leading with.
  let bigWinSection: string;
  if (latestSummary?.big_win) {
    bigWinSection = `<p>${latestSummary.big_win}</p>`;
  } else {
    bigWinSection = `<p>[THE BIG WIN — the single standout achievement this block and why it matters]</p>`;
  }

  // What's next
  let whatsNextSection: string;
  if (latestSummary?.next_block_focus) {
    whatsNextSection = `<p>${latestSummary.next_block_focus}</p>`;
  } else if (nextBlock?.block_note) {
    whatsNextSection = `<p>${nextBlock.block_note}</p>`;
  } else {
    whatsNextSection = `<p>[WHAT'S NEXT — what the next block focuses on]</p>`;
  }

  // Worth saying
  let worthSayingSection: string;
  if (latestSummary?.worth_saying) {
    worthSayingSection = `<p>${latestSummary.worth_saying}</p>`;
  } else if (profile.notes.esther_observations) {
    worthSayingSection = `<p>${profile.notes.esther_observations}</p>`;
  } else {
    worthSayingSection = `<p>[WORTH SAYING — extra thoughts, encouragement, observations]</p>`;
  }

  return {
    clientName,
    attendanceSection,
    bigWinSection,
    highlightsSection,
    whatsNextSection,
    worthSayingSection,
  };
}

function generateFallback(
  profile: import("@/types").ClientProfile,
  blocks: DBBlock[],
  summaries: BlockSummary[],
  nextBlock: DBBlock | null,
  clientName: string,
  blockNumber: number,
): SixWeekUpdateDraft {
  const data = buildSections(profile, blocks, summaries, nextBlock, clientName);
  return {
    subject: "Your last 6 weeks with me 🏋️",
    html: buildSixWeekUpdateHtml(data),
    data,
    blockNumber,
    generatedAt: new Date().toISOString(),
    provider: null,
  };
}

async function generateViaAi(
  aiConfig: import("@/lib/ai-client").AiConfig,
  profile: import("@/types").ClientProfile,
  blocks: DBBlock[],
  summaries: BlockSummary[],
  nextBlock: DBBlock | null,
  clientName: string,
  blockNumber: number,
  conversationSummary?: string,
): Promise<SixWeekUpdateDraft> {
  const system = `You are Esther Fair, a Level 4 Personal Trainer in Worthing, West Sussex.
You write warm, expert, first-person emails to your clients. You speak as you would in person — not corporate, not hypey.

Rules:
- Never use "transformation", "results", "crush it", "push your limits", "before and after"
- Frame everything clinically and respectfully
- Never invent progress — if data is missing, leave a [CLIENT] placeholder
- Write in first person as Esther
- Use plain English, not jargon
- This is an email to a real client — be personal and specific`;

  const user = `Write a 6-week update email for ${clientName}. Here is what I know:

Client Profile:
${JSON.stringify(profile, null, 2)}

Completed Blocks:
${JSON.stringify(blocks, null, 2)}

Block Summaries (structured):
${JSON.stringify(summaries, null, 2)}

Next Block:
${JSON.stringify(nextBlock, null, 2)}
${conversationSummary ? `\nEsther's notes from a chat about this update (use this as the primary source for what to say — it's more current and specific than the stored data above):\n${conversationSummary}\n` : ""}
Return valid JSON with these fields:
{
  "subject": "string",
  "attendanceSection": "HTML string for attendance & consistency section",
  "bigWinSection": "HTML string for the single biggest win this block and why it matters",
  "highlightsSection": "HTML string for strength & fitness highlights section",
  "whatsNextSection": "HTML string for what's next section",
  "worthSayingSection": "HTML string for worth saying section"
}

No markdown, no preamble, no explanation.`;

  const text = await aiChat({ system, user, maxTokens: 4000 });
  if (!text) throw new Error("AI returned no response");

  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  const data: SixWeekUpdateData = {
    clientName,
    attendanceSection: parsed.attendanceSection || "[ATTENDANCE]",
    bigWinSection: parsed.bigWinSection || "[THE BIG WIN]",
    highlightsSection: parsed.highlightsSection || "[HIGHLIGHTS]",
    whatsNextSection: parsed.whatsNextSection || "[WHAT'S NEXT]",
    worthSayingSection: parsed.worthSayingSection || "[WORTH SAYING]",
  };

  return {
    subject: parsed.subject || "Your last 6 weeks with me 🏋️",
    html: buildSixWeekUpdateHtml(data),
    data,
    blockNumber,
    generatedAt: new Date().toISOString(),
    provider: aiConfig.provider,
  };
}
