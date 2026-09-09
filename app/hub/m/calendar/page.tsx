import { createClient } from "@/lib/supabase-server";
import type { Session } from "@/types";
import { deriveSessionStatus } from "@/lib/session-status";
import { sessionWorkoutName } from "@/lib/session-display";
import { sessionDurationMinutes } from "@/lib/scheduling";
import { toIsoTimestamp } from "@/lib/pg-timestamp";
import {
  todayLocalISODate,
  shiftDay,
  isoToLocalDate,
} from "@/lib/schedule-dates";
import Link from "next/link";
import { DayAgenda } from "@/components/hub/DayAgenda";

const ICO = {
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
};

const PAST_MAX = 30;
const FUTURE_DAYS = 14;


interface SessionRow {
  id: string;
  block_id: string;
  session_number: number;
  archetype: string | null;
  data: Session | null;
  scheduled_at: string | null;
  cancelled_at: string | null;
  status: string | null;
  completed_at: string | null;
}



function windowBounds(pastDays: number) {
  const today = todayLocalISODate();
  const clamped = Math.min(Math.max(pastDays, 0), PAST_MAX);
  return {
    today,
    start: clamped > 0 ? shiftDay(today, -clamped) : today,
    end: shiftDay(today, FUTURE_DAYS),
  };
}

export default async function MobileCalendarPage({
  searchParams,
}: {
  searchParams?: { past?: string };
}) {
  const pastDays = Number(searchParams?.past) || 0;
  const supabase = createClient();
  const { today, start, end } = windowBounds(pastDays);

  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("id, block_id, session_number, archetype, data, scheduled_at, cancelled_at, status, completed_at")
    .not("scheduled_at", "is", null)
    .is("parent_session_id", null)
    .order("scheduled_at", { ascending: true });

  const sessions: SessionRow[] = ((sessionRows ?? []) as SessionRow[]).filter((s) => {
    const day = isoToLocalDate(s.scheduled_at as string);
    return day >= start && day <= end;
  });

  const blockIds = [...new Set(sessions.map((s) => s.block_id).filter(Boolean))];
  const { data: blockRows } = blockIds.length
    ? await supabase.from("blocks").select("id, client_id, block_number").in("id", blockIds)
    : { data: [] as { id: string; client_id: string; block_number: number }[] };
  const blocks = blockRows ?? [];
  const blockById = new Map(blocks.map((b) => [b.id, b]));

  const clientIds = [...new Set(blocks.map((b) => b.client_id).filter(Boolean))];
  const { data: clientRows } = clientIds.length
    ? await supabase.from("clients").select("id, name, client_number, active_program_id").in("id", clientIds)
    : { data: [] as { id: string; name: string; client_number: number | null; active_program_id: string | null }[] };
  const clients = clientRows ?? [];
  const clientById = new Map(clients.map((c) => [c.id, c]));

  // Resolve programme names for clients with active programmes
  const programIds = [...new Set(clients.map((c) => c.active_program_id).filter(Boolean))] as string[];
  const { data: programRows } = programIds.length
    ? await supabase.from("programs").select("id, name").in("id", programIds)
    : { data: [] as { id: string; name: string }[] };
  const programNameById = new Map((programRows ?? []).map((p) => [p.id, p.name]));

  const agendaSessions = sessions.map((s) => {
    const block = blockById.get(s.block_id);
    const client = block ? clientById.get(block.client_id) : undefined;
    const sessionLog = s.data?.session_log ?? null;
    const programmeName = client?.active_program_id
      ? programNameById.get(client.active_program_id) ?? null
      : null;
    return {
      id: s.id,
      scheduledAt: toIsoTimestamp(s.scheduled_at) as string,
      name: sessionWorkoutName(s, `Session ${s.session_number}`),
      status: deriveSessionStatus({
        status: s.status,
        cancelled_at: s.cancelled_at,
        completed_at: s.completed_at,
        scheduled_at: s.scheduled_at,
        session_log: s.data?.session_log,
      }),
      clientName: client?.name ?? "Unknown client",
      blockNumber: block?.block_number ?? null,
      durationMinutes: sessionDurationMinutes((s.data?.time_tier ?? null) as any),
      sessionLogStartedAt: sessionLog?.started_at ?? null,
      sessionLogCompletedAt: sessionLog?.completed_at ?? null,
      completedAt: s.completed_at ?? sessionLog?.completed_at ?? null,
      programmeName,
    };
  });

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <div className="mbrand">
            <img src="/images/ef-heart-logo.svg" alt="Eternal Fitness" />
            <span className="mbrand-sub">Trainer Hub</span>
          </div>
        </div>
      </header>
      <main className="mcontent has-fab">
        <div className="note">
          <span className="note-b">i</span>
          <div>
            <b>Day-agenda calendar.</b> One row per day, forward and back from today. Empty days still
            render — tap one to book a session. Weeks are Monday–Sunday.
          </div>
        </div>

        <Link
          className="past-toggle"
          href={pastDays > 0 ? "/hub/m/calendar" : "/hub/m/calendar?past=7"}
        >
          {pastDays > 0 ? "Hide past days" : "Show past 7 days"}
        </Link>

        <DayAgenda
          sessions={agendaSessions}
          today={today}
          windowStart={start}
          windowEnd={end}
          scope="trainer"
        />
      </main>
      <Link className="fab" href={`/hub/m/book?scope=trainer&day=${today}`} data-od-id="agenda-add">
        {ICO.plus}
        Book session
      </Link>
    </>
  );
}
