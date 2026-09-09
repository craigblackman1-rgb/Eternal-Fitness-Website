import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { londonDayKey } from "@/lib/schedule-dates";

/**
 * GET /api/sessions/today-next?exclude=<sessionId>
 *
 * Returns the next scheduled session TODAY (after now) across all clients,
 * for the post-complete "Done — next up: {client} at {time}" message.
 * Excludes cancelled sessions and the optionally specified session.
 */

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const excludeId = searchParams.get("exclude");

  const todayKey = londonDayKey(new Date().toISOString());
  const now = new Date();

  // Query today's scheduled sessions (non-cancelled, non-child) with client names
  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("id, scheduled_at, session_number, block_id, data")
    .not("scheduled_at", "is", null)
    .is("cancelled_at", null)
    .is("parent_session_id", null);

  if (!sessionRows || sessionRows.length === 0) {
    return NextResponse.json(null);
  }

  // Filter to today and after now, excluding the current session
  const todaySessions = sessionRows
    .filter((s) => {
      if (excludeId && s.id === excludeId) return false;
      const key = londonDayKey(s.scheduled_at as string);
      if (key !== todayKey) return false;
      return new Date(s.scheduled_at as string).getTime() > now.getTime();
    })
    .sort((a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime());

  if (todaySessions.length === 0) {
    return NextResponse.json(null);
  }

  const next = todaySessions[0];

  // Resolve client name via block → client join
  let clientName: string | null = null;
  if (next.block_id) {
    const { data: block } = await supabase
      .from("blocks")
      .select("client_id")
      .eq("id", next.block_id)
      .single();
    if (block) {
      const { data: client } = await supabase
        .from("clients")
        .select("name")
        .eq("id", block.client_id)
        .single();
      clientName = client?.name ?? null;
    }
  }

  const scheduledDate = new Date(next.scheduled_at as string);
  const time = scheduledDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });

  return NextResponse.json({
    sessionId: next.id,
    clientName,
    time,
  });
}
