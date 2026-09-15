import { createClient } from "@/lib/supabase-server";
import { sessionDurationMinutes } from "@/lib/scheduling";
import { sessionWorkoutName } from "@/lib/session-display";
import { toIsoTimestamp } from "@/lib/pg-timestamp";
import type { Session, TimeTier } from "@/types";
import { TrainScreen } from "./TrainScreen";

export interface TrainEntry {
  id: string;
  clientId: string | null;
  clientName: string;
  clientNumber: number | null;
  complianceStatus: string | null;
  sessionNumber: number;
  archetype: string;
  blockNumber: number | null;
  scheduledAt: string;
  durationMinutes: number;
  status: string | null;
  completedAt: string | null;
  sessionLogCompletedAt: string | null;
  sessionLogStartedAt: string | null;
  startedAt: string | null;
  lapseFlaggedAt: string | null;
  focusLabel: string;
  displayName: string;
}

export default async function TrainTabPage() {
  const supabase = createClient();

  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("id, block_id, session_number, archetype, data, scheduled_at, cancelled_at, status, completed_at, started_at, lapse_flagged_at")
    .not("scheduled_at", "is", null)
    .is("cancelled_at", null)
    .is("parent_session_id", null)
    .order("scheduled_at", { ascending: true });

  const sessions: Array<{
    id: string;
    block_id: string;
    session_number: number;
    archetype: string | null;
    data: Session | null;
    scheduled_at: string | null;
    status: string | null;
    completed_at: string | null;
    started_at: string | null;
    lapse_flagged_at: string | null;
  }> = sessionRows ?? [];

  const blockIds = [...new Set(sessions.map((s) => s.block_id).filter(Boolean))];
  const { data: blockRows } = blockIds.length
    ? await supabase.from("blocks").select("id, client_id, block_number").in("id", blockIds)
    : { data: [] as { id: string; client_id: string; block_number: number }[] };
  const blocks = blockRows ?? [];
  const blockById = new Map(blocks.map((b) => [b.id, b]));

  const clientIds = [...new Set(blocks.map((b) => b.client_id).filter(Boolean))];
  const { data: clientRows } = clientIds.length
    ? await supabase.from("clients").select("id, name, client_number, compliance_status").in("id", clientIds)
    : { data: [] as { id: string; name: string; client_number: number | null; compliance_status: string | null }[] };
  const clients = clientRows ?? [];
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const entries: TrainEntry[] = sessions
    .filter((s) => s.scheduled_at)
    .map((s) => {
      const block = blockById.get(s.block_id);
      const client = block ? clientById.get(block.client_id) : undefined;
      const timeTier = (s.data?.time_tier ?? null) as TimeTier | null;
      const sessionLog = s.data?.session_log ?? null;
      return {
        id: s.id,
        clientId: block?.client_id ?? null,
        clientName: client?.name ?? "Unknown client",
        clientNumber: client?.client_number ?? null,
        complianceStatus: client?.compliance_status ?? null,
        sessionNumber: s.session_number,
        archetype: s.archetype,
        blockNumber: block?.block_number ?? null,
        scheduledAt: toIsoTimestamp(s.scheduled_at) as string,
        durationMinutes: sessionDurationMinutes(timeTier),
        status: s.status,
        completedAt: s.completed_at,
        sessionLogCompletedAt: sessionLog?.completed_at ?? null,
        sessionLogStartedAt: sessionLog?.started_at ?? null,
        startedAt: s.started_at ?? null,
        lapseFlaggedAt: s.lapse_flagged_at ?? null,
        focusLabel: s.data?.focus_label ?? "",
        displayName: sessionWorkoutName(s, `Session ${s.session_number}`),
      };
    });

  return <TrainScreen entries={entries} />;
}
