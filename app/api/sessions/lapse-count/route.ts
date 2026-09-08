import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * Count of flagged lapse sessions (lapse_flagged_at IS NOT NULL,
 * status=scheduled, not a sub-session). Supports ?count=true for the triage
 * filter badge.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .not("lapse_flagged_at", "is", null)
    .eq("status", "scheduled")
    .is("parent_session_id", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
