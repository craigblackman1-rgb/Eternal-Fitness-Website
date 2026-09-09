import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { toIsoTimestamp } from "@/lib/pg-timestamp";

export default async function TrainTabPage() {
  const supabase = createClient();

  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("id, data, scheduled_at, cancelled_at, status, completed_at")
    .not("scheduled_at", "is", null)
    .is("cancelled_at", null)
    .is("parent_session_id", null);

  const sessions = (sessionRows ?? []) as {
    id: string;
    data: {
      session_log?: { started_at?: string | null; completed_at?: string | null } | null;
    } | null;
    scheduled_at: string;
    status?: string | null;
    completed_at?: string | null;
  }[];

  // Normalise to strict ISO-8601 (offset-preserving) so WebKit (iOS Safari)
  // doesn't render "Invalid Date" — see lib/pg-timestamp.ts.
  for (const s of sessions) {
    s.scheduled_at = toIsoTimestamp(s.scheduled_at) as string;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const todaySessions = sessions
    .filter((s) => {
      const at = new Date(s.scheduled_at);
      return at >= todayStart && at < todayEnd;
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const inProgress = todaySessions.find(
    (s) =>
      s.status === "in_progress" ||
      (!s.status && s.data?.session_log?.started_at && !s.data?.session_log?.completed_at),
  );
  const nextUpcoming = todaySessions.find((s) => !s.data?.session_log?.completed_at);

  // Intent rule: jump to a session only if one is in progress now or starts
  // within 30 minutes.  Otherwise land on the Today day list (/hub/m) so the
  // trainer sees the full day context rather than a dead-end empty state.
  const THIRTY_MIN = 30 * 60 * 1000;
  const target =
    inProgress ??
    (nextUpcoming &&
    new Date(nextUpcoming.scheduled_at).getTime() - now.getTime() <= THIRTY_MIN
      ? nextUpcoming
      : null);

  if (target) redirect(`/hub/m/train/${target.id}`);
  redirect("/hub/m");
}
