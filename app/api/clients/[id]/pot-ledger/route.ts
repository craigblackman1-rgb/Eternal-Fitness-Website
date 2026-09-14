import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { buildPotLedger } from "@/lib/pot-ledger";

/* ── GET /api/clients/[id]/pot-ledger ──────────────────────────────────
 * Derives the full pot ledger from sessions rows + block_expiry_extensions.
 * No new tables — everything is computed from existing data.
 *
 * Returns:
 *   consumption: { completed, cancelled_free, cancelled_charged, rescheduled, no_show, remaining, purchased }
 *   ledger: [{ date, event, delta, remaining, used, tags }]
 */

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch client — include pot_baseline_used for the pre-hub opening balance
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, start_date, created_at, sessions_purchased, block_expiry_date, block_expiry_extensions, pot_baseline_used, pot_baseline_note, pot_baseline_at")
    .eq("client_number", parseInt(params.id))
    .single();
  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch all sessions for this client — sessions link via blocks, not client_id
  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("id")
    .eq("client_id", client.id);
  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }
  const blockIds = (blocks ?? []).map((b: { id: string }) => b.id);

  let sessions: {
    id: string;
    status: string | null;
    cancelled_at: string | null;
    charged_free: string | null;
    scheduled_at: string | null;
    completed_at: string | null;
    parent_session_id: string | null;
    block_id: string;
    session_number: number | null;
    data: Record<string, unknown> | null;
  }[] = [];
  if (blockIds.length > 0) {
    const { data: sessionRows, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, status, cancelled_at, charged_free, scheduled_at, completed_at, parent_session_id, block_id, session_number, data")
      .in("block_id", blockIds)
      .order("scheduled_at", { ascending: true });
    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }
    sessions = (sessionRows ?? []) as typeof sessions;
  }

  // BUG-EF-144 + BUG-EF-148 — carry null purchased/remaining through unchanged.
  // purchased=null means ongoing (no fixed package), not zero.
  const purchased = client.sessions_purchased ?? null;

  const { consumption, ledger } = buildPotLedger({
    sessions,
    purchased,
    start_date: (client as any).start_date ?? null,
    block_expiry_date: client.block_expiry_date ?? null,
    block_expiry_extensions: ((client.block_expiry_extensions ?? []) as { from: string; to: string; at: string; reason?: string }[]),
    pot_baseline_used: (client as any).pot_baseline_used ?? 0,
    pot_baseline_at: (client as any).pot_baseline_at ?? null,
  });

  // BUG-EF-162 — expose booked sessions so move/cancel dialogs can mark clashes
  const bookedSessions = sessions
    .filter((s) => s.scheduled_at && !s.cancelled_at)
    .map((s) => ({ id: s.id, scheduled_at: s.scheduled_at }));

  return NextResponse.json({ consumption, ledger, sessions: bookedSessions });
}
