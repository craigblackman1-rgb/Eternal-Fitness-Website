import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sessionWorkoutName } from "@/lib/session-display";

/**
 * Returns the same data shape the LapseReview client component expects,
 * fetched server-side. Used by the triage screen's LapseReviewWithData
 * wrapper so the existing component is reused unchanged.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. All flagged sessions (lapse_flagged_at set, status still scheduled)
  const { data: flaggedRows, error: e1 } = await supabase
    .from("sessions")
    .select("id, block_id, session_number, scheduled_at, lapse_flagged_at, data")
    .not("lapse_flagged_at", "is", null)
    .eq("status", "scheduled")
    .is("parent_session_id", null)
    .order("scheduled_at", { ascending: false });

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const flagged = flaggedRows ?? [];
  if (flagged.length === 0) return NextResponse.json({ clients: [] });

  // 2. Collect unique client_ids via blocks
  const blockIds = [...new Set(flagged.map((s) => s.block_id))];
  const { data: blockRows } = await supabase
    .from("blocks")
    .select("id, client_id, block_number")
    .in("id", blockIds);

  const blockClientIdMap = new Map<string, string>();
  const blockNumberMap = new Map<string, number>();
  for (const b of blockRows ?? []) {
    blockClientIdMap.set(b.id, b.client_id);
    blockNumberMap.set(b.id, b.block_number);
  }

  const clientIds = [...new Set(blockClientIdMap.values())];

  // 3. Clients for names
  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name")
    .in("id", clientIds);

  const clientsMap = new Map<string, string>();
  for (const c of clientRows ?? []) {
    clientsMap.set(c.id, c.name);
  }

  // 4. Group flagged sessions by client
  const sessionsByClient = new Map<string, { id: string; sessionNumber: number; scheduledAt: string | null; blockNumber: number; workoutLabel: string | null }[]>();
  for (const s of flagged) {
    const clientId = blockClientIdMap.get(s.block_id);
    if (!clientId) continue;
    if (!sessionsByClient.has(clientId)) sessionsByClient.set(clientId, []);
    sessionsByClient.get(clientId)!.push({
      id: s.id,
      sessionNumber: s.session_number,
      scheduledAt: s.scheduled_at,
      blockNumber: blockNumberMap.get(s.block_id) ?? 0,
      workoutLabel: sessionWorkoutName(s, `Session ${s.session_number}`),
    });
  }

  const clients = clientIds
    .map((clientId) => ({
      clientId,
      clientName: clientsMap.get(clientId) ?? "Unknown",
      sessions: sessionsByClient.get(clientId) ?? [],
    }))
    .filter((c) => c.sessions.length > 0)
    .sort((a, b) => a.clientName.localeCompare(b.clientName));

  return NextResponse.json({ clients });
}
