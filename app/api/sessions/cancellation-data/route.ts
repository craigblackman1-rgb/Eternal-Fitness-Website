import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { deriveSessionPot } from "@/lib/session-pot";
import { sessionWorkoutName } from "@/lib/session-display";

/**
 * Returns the same data shape the CancellationReview client component expects,
 * fetched server-side. Used by the triage screen's CancellationReviewWithData
 * wrapper so the existing component is reused unchanged.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. All unreviewed cancellations — exclude sub-sessions
  const { data: unreviewedRows, error: e1 } = await supabase
    .from("sessions")
    .select("id, block_id, session_number, scheduled_at, cancel_reason, charged_free, status, cancelled_at, parent_session_id, archetype, data")
    .eq("status", "cancelled")
    .is("charged_free", null)
    .is("parent_session_id", null)
    .order("scheduled_at", { ascending: false });

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const unreviewed = unreviewedRows ?? [];
  if (unreviewed.length === 0) return NextResponse.json({ clients: [] });

  // 2. Collect unique client_ids via blocks
  const blockIds = [...new Set(unreviewed.map((s) => s.block_id))];
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

  // 3. Clients for names + sessions_purchased
  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, sessions_purchased, pot_baseline_used")
    .in("id", clientIds);

  const clientsMap = new Map<string, { name: string; sessionsPurchased: number | null; baselineUsed: number }>();
  for (const c of clientRows ?? []) {
    clientsMap.set(c.id, { name: c.name, sessionsPurchased: c.sessions_purchased, baselineUsed: c.pot_baseline_used ?? 0 });
  }

  // 4. All sessions per client (for pot calculation — excludes sub-sessions)
  const { data: allSessionRows } = await supabase
    .from("sessions")
    .select("id, status, charged_free, cancelled_at, block_id, parent_session_id")
    .in("block_id", blockIds);

  const sessionsByClient = new Map<string, typeof unreviewed>();
  for (const s of allSessionRows ?? []) {
    const clientId = blockClientIdMap.get(s.block_id);
    if (!clientId) continue;
    if (!sessionsByClient.has(clientId)) sessionsByClient.set(clientId, []);
    sessionsByClient.get(clientId)!.push(s);
  }

  // 5. Build client data with pot breakdowns
  const clients = clientIds.map((clientId) => {
    const client = clientsMap.get(clientId) ?? { name: "Unknown", sessionsPurchased: null, baselineUsed: 0 };
    const allSessions = sessionsByClient.get(clientId) ?? [];
    const unreviewedSessions = unreviewed.filter((s) => blockClientIdMap.get(s.block_id) === clientId);
    const pot = deriveSessionPot(allSessions, client.sessionsPurchased, client.baselineUsed);

    return {
      clientId,
      clientName: client.name,
      sessionsPurchased: client.sessionsPurchased,
      baselineUsed: client.baselineUsed,
      pot,
      sessions: unreviewedSessions.map((s) => ({
        id: s.id,
        sessionNumber: s.session_number,
        scheduledAt: s.scheduled_at,
        cancelReason: s.cancel_reason,
        blockNumber: blockNumberMap.get(s.block_id) ?? 0,
        focusLabel: sessionWorkoutName(s, `Session ${s.session_number}`),
      })),
    };
  }).filter((c) => c.sessions.length > 0)
    .sort((a, b) => a.clientName.localeCompare(b.clientName));

  return NextResponse.json({ clients });
}
