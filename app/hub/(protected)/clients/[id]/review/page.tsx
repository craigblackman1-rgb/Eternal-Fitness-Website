import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { computeComplianceFlags } from "@/lib/compliance";
import { deriveSessionPot } from "@/lib/session-pot";
import { sessionWorkoutName } from "@/lib/session-display";
import { buildExerciseHistory } from "@/lib/exercise-history";
import { deriveBlockStatus } from "@/lib/block-status";
import { deriveSessionStatus } from "@/lib/session-status";
import { trainerizeResultsToSetLogs } from "@/lib/trainerize-adapter";
import { getClientProgramState } from "@/lib/programs/queue";
import type { SetLog, DBClientReview } from "@/types";
import type { QueueState } from "@/lib/programs/types";
import { ReviewFlowClient } from "./ReviewFlowClient";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserName = user?.name || "Staff";

  const numericId = parseInt(params.id);
  if (isNaN(numericId)) notFound();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("client_number", numericId)
    .single();
  if (clientError || !client) notFound();

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("client_id", client.id)
    .order("block_number", { ascending: false });

  const blockIds = (blocks ?? []).map((b) => b.id);
  let sessions: any[] = [];
  if (blockIds.length > 0) {
    const { data } = await supabase
      .from("sessions")
      .select("*, blocks(block_number)")
      .in("block_id", blockIds)
      .order("session_number", { ascending: false });
    sessions = data ?? [];
  }

  const { data: clientDocuments } = await supabase
    .from("client_documents")
    .select("id, kind, title, status")
    .eq("client_id", client.id);

  const hasSignedParqDocument = (clientDocuments ?? []).some(
    (d: any) => d.kind === "parq" && d.status === "signed",
  );
  const hasSignedAgreementDocument = (clientDocuments ?? []).some(
    (d: any) => d.kind === "terms" && d.status === "signed",
  );

  const { data: latestParq } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestAgreement } = await supabase
    .from("signed_agreements")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const complianceFlags = computeComplianceFlags({
    client,
    latestParq,
    latestAgreement,
    hasSignedParqDocument,
    hasSignedAgreementDocument,
  });

  // BUG-EF-151 — derive block status from sessions (same chain as clients/[id]/page.tsx:370-378).
  const derivedStatusByBlock = new Map<string, import("@/types").BlockStatus>();
  for (const block of (blocks ?? [])) {
    const blockSessions = (sessions ?? []).filter((s: any) => s.block_id === block.id);
    derivedStatusByBlock.set(block.id, deriveBlockStatus(block.status, blockSessions));
  }

  const activeBlock = (blocks ?? []).find((b) => derivedStatusByBlock.get(b.id) === "active")
    ?? (blocks ?? []).find((b) => b.status === "approved")
    ?? (blocks ?? [])[0]
    ?? null;
  const activeBlockSessions = activeBlock ? sessions.filter((s) => s.block_id === activeBlock.id) : [];
  const pot = deriveSessionPot(activeBlockSessions, client.sessions_purchased, client.pot_baseline_used ?? 0);

  // BUG-EF-151 — fetch combined hub + Trainerize set-log source (same as
  // clients/[id]/page.tsx:120-145) so PBs match the Progress drawer.
  const hubSessionIds = sessions.map((s: any) => s.id);
  const { data: hubSetLogs } = hubSessionIds.length > 0
    ? await supabase.from("set_logs").select("*").in("session_id", hubSessionIds).order("logged_at", { ascending: true })
    : { data: [] as any[] };
  const { data: trainerizeWorkoutResults } = await supabase
    .from("trainerize_workout_results")
    .select("id, trainerize_daily_workout_id, workout_name, performed_date, rpe, trainerize_daily_exercise_id, exercise_name, set_number, reps, weight, duration_seconds")
    .eq("client_id", client.id)
    .order("performed_date", { ascending: false });

  const combinedSetLogs: SetLog[] = [
    ...((hubSetLogs ?? []) as SetLog[]),
    ...trainerizeResultsToSetLogs((trainerizeWorkoutResults ?? []) as any),
  ];

  // ── Review window (BUG-EF-151 R2) ────────────────────────────────────────
  // Scope stats to a meaningful period, not the (possibly future) active block.
  const { data: reviews } = await supabase
    .from("client_reviews")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const allCompletedSessions = (sessions ?? []).filter((s: any) => {
    if (s.parent_session_id) return false;
    return deriveSessionStatus(s) === "completed";
  });

  // BUG-EF-151 — a session derives as completed from three sources (status
  // column, completed_at column, data.session_log.completed_at). The window
  // below must never read only the completed_at column, or a real delivery
  // whose column lags the JSON record is silently dropped and the review
  // reports "0 sessions" while check-ins exist. Normalise to one instant.
  const completedAtOf = (s: any): string | null =>
    s.completed_at ?? (s.data as any)?.session_log?.completed_at ?? null;

  const now = new Date();
  const FORTY_TWO_DAYS_MS = 42 * 24 * 60 * 60 * 1000;
  const previousReview = (reviews ?? [])[0] ?? null;

  let windowStart: Date;
  let windowSource: "review" | "default" | "fallback" = "review";

  if (previousReview) {
    windowStart = new Date(previousReview.created_at);
  } else {
    const defaultStart = new Date(now.getTime() - FORTY_TWO_DAYS_MS);
    const hasInDefault = allCompletedSessions.some(
      (s) => {
        const at = completedAtOf(s);
        return at && new Date(at) >= defaultStart;
      },
    );
    if (hasInDefault) {
      windowStart = defaultStart;
      windowSource = "default";
    } else {
      // Find the most recent 42-day span containing the latest completed session
      const sorted = [...allCompletedSessions].sort(
        (a, b) => new Date(completedAtOf(b)!).getTime() - new Date(completedAtOf(a)!).getTime(),
      );
      const latest = sorted[0];
      const latestAt = latest ? completedAtOf(latest) : null;
      if (latestAt) {
        const latestDate = new Date(latestAt);
        windowStart = new Date(latestDate.getTime() - FORTY_TWO_DAYS_MS);
      } else {
        windowStart = defaultStart;
      }
      windowSource = "fallback";
    }
  }

  const reviewWindowSessions = allCompletedSessions.filter((s) => {
    const at = completedAtOf(s);
    if (!at) return false;
    return new Date(at) >= windowStart;
  });

  // PBs scoped to review window, across all blocks
  let pbsCount = 0;
  {
    const scopedLogs = combinedSetLogs.filter((log) => {
      if (!log.logged_at) return false;
      return new Date(log.logged_at) >= windowStart;
    });
    const exerciseHistory = buildExerciseHistory(scopedLogs);
    pbsCount = exerciseHistory.reduce((count, entry) => {
      return count + entry.personalBests.filter((pb) => {
        return new Date(pb.achievedAt) >= windowStart;
      }).length;
    }, 0);
  }

  // Window label
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  let windowLabel: string;
  if (windowSource === "review") {
    windowLabel = `Since last review, ${fmtDate(windowStart)} – today`;
  } else if (windowSource === "default") {
    windowLabel = `Last 6 weeks — ${fmtDate(windowStart)} – today`;
  } else {
    const latestCompleted = [...reviewWindowSessions]
      .filter((s) => completedAtOf(s))
      .sort((a, b) => new Date(completedAtOf(b)!).getTime() - new Date(completedAtOf(a)!).getTime())[0];
    const latestAt = latestCompleted ? completedAtOf(latestCompleted) : null;
    const endLabel = latestAt ? fmtDate(new Date(latestAt)) : "today";
    windowLabel = `Last training period, ${fmtDate(windowStart)} – ${endLabel}`;
  }

  // Completed session names in the window (for ProgressStep)
  const completedWithNames = reviewWindowSessions.map((s) => ({
    id: s.id,
    name: sessionWorkoutName(s.data),
    scheduled_at: s.scheduled_at,
    position: "",
  }));

  // Position: programme-based, never from the (possibly empty) active block
  const programmeState = client.active_program_id
    ? await getClientProgramState(client.id).catch(() => null)
    : null;

  // Earliest FUTURE scheduled date of the active block, for "not started" label
  const programmeFirstDate = activeBlockSessions
    .map((s) => s.scheduled_at)
    .filter((d): d is string => !!d && new Date(d) >= now)
    .sort()[0] ?? null;

  // Unreviewed cancellations and lapsed sessions (still active-block-scoped —
  // these are action items, not stats)
  const unreviewedCancellations = activeBlockSessions.filter((s) => {
    return deriveSessionStatus(s) === "cancelled" && s.charged_free == null && !s.parent_session_id;
  });

  const lapsedSessions = activeBlockSessions.filter(
    (s) => s.lapse_flagged_at && !s.parent_session_id,
  );

  const extensionHistory = (client as any).block_expiry_extensions ?? [];

  const hasDeliveredSessions = reviewWindowSessions.length > 0;

  // BUG-EF-151 — EmptyState must only show when the client has NEVER had a
  // completed session anywhere, not just in the current block.
  const hasAnyCompletedSessions = allCompletedSessions.length > 0;

  // Active-block scope for OutstandingStep/PositionStep (action items, not stats)
  const hasActiveBlockDeliveredSessions = activeBlockSessions.some(
    (s) => !s.parent_session_id && deriveSessionStatus(s) === "completed",
  );

  // Recent sessions: 5 most recent completed in window, with set-log counts
  const recentSessionIds = reviewWindowSessions
    .sort((a, b) => {
      const aTime = completedAtOf(a) ? new Date(completedAtOf(a)!).getTime() : 0;
      const bTime = completedAtOf(b) ? new Date(completedAtOf(b)!).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5)
    .map((s) => s.id);

  const setLogCountBySession = new Map<string, number>();
  if (recentSessionIds.length > 0) {
    const { data: recentSetLogs } = await supabase
      .from("set_logs")
      .select("session_id")
      .in("session_id", recentSessionIds);
    for (const log of recentSetLogs ?? []) {
      const sid = (log as any).session_id;
      if (sid) setLogCountBySession.set(sid, (setLogCountBySession.get(sid) ?? 0) + 1);
    }
  }

  const recentSessionsData = reviewWindowSessions
    .filter((s) => recentSessionIds.includes(s.id))
    .sort((a, b) => {
      const aTime = completedAtOf(a) ? new Date(completedAtOf(a)!).getTime() : 0;
      const bTime = completedAtOf(b) ? new Date(completedAtOf(b)!).getTime() : 0;
      return bTime - aTime;
    })
    .map((s) => ({
      id: s.id,
      name: sessionWorkoutName(s.data),
      completed_at: completedAtOf(s),
      setLogCount: setLogCountBySession.get(s.id) ?? 0,
    }));

  return (
    <ReviewFlowClient
      client={client}
      sessions={sessions}
      activeBlock={activeBlock}
      pot={pot}
      completedSessions={completedWithNames}
      unreviewedCancellations={unreviewedCancellations}
      lapsedSessions={lapsedSessions}
      complianceFlags={complianceFlags}
      reviews={(reviews ?? []) as DBClientReview[]}
      extensionHistory={extensionHistory}
      pbsCount={pbsCount}
      hasDeliveredSessions={hasDeliveredSessions}
      hasAnyCompletedSessions={hasAnyCompletedSessions}
      hasActiveBlockDeliveredSessions={hasActiveBlockDeliveredSessions}
      blockExpiryDate={client.block_expiry_date}
      clientNumber={numericId}
      currentUserName={currentUserName}
      windowLabel={windowLabel}
      recentSessions={recentSessionsData}
      programmePosition={programmeState ? { completedCount: programmeState.completedCount, totalSlots: programmeState.totalSlots } : null}
      programmeFirstDate={programmeFirstDate}
    />
  );
}
