import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { computeComplianceFlags } from "@/lib/compliance";
import { deriveSessionPot } from "@/lib/session-pot";
import { deriveChronologicalPositions, sessionChronologicalLabel } from "@/lib/session-chronological-order";
import { sessionWorkoutName } from "@/lib/session-display";
import { buildExerciseHistory } from "@/lib/exercise-history";
import { deriveBlockStatus } from "@/lib/block-status";
import { deriveSessionStatus } from "@/lib/session-status";
import { trainerizeResultsToSetLogs } from "@/lib/trainerize-adapter";
import { buildExerciseTrends, type TrendSessionMeta } from "@/lib/progress";
import type { SetLog, DBClientReview } from "@/types";
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

  const positions = deriveChronologicalPositions(activeBlockSessions);
  const chronologicalTotal = Array.from(positions.values())[0]?.total ?? 0;

  // BUG-EF-151 — use deriveSessionStatus instead of ad-hoc status check.
  const completedSessions = activeBlockSessions.filter((s) => {
    if (s.parent_session_id) return false;
    return deriveSessionStatus(s) === "completed";
  });

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

  const trendSessionMeta: Record<string, TrendSessionMeta> = {};
  for (const s of sessions ?? []) {
    trendSessionMeta[s.id] = {
      blockNumber: (s as any).blocks?.block_number ?? null,
      sessionNumber: s.session_number ?? null,
    };
  }
  const exerciseTrends = buildExerciseTrends(combinedSetLogs, trendSessionMeta);

  // Compute personal bests from combined source scoped to the review period.
  const blockStartedAt = activeBlock?.scheduled_start;
  let pbsCount = 0;
  if (blockStartedAt) {
    const scopedLogs = combinedSetLogs.filter((log) => {
      if (!log.logged_at) return false;
      return new Date(log.logged_at) >= new Date(blockStartedAt);
    });
    const exerciseHistory = buildExerciseHistory(scopedLogs);
    pbsCount = exerciseHistory.reduce((count, entry) => {
      return count + entry.personalBests.filter((pb) => {
        return new Date(pb.achievedAt) >= new Date(blockStartedAt);
      }).length;
    }, 0);
  } else {
    const exerciseHistory = buildExerciseHistory(combinedSetLogs);
    pbsCount = exerciseHistory.reduce((count, entry) => count + entry.personalBests.length, 0);
  }

  const completedWithNames = completedSessions.map((s) => {
    const pos = positions.get(s.id);
    return {
      id: s.id,
      name: sessionWorkoutName(s.data),
      scheduled_at: s.scheduled_at,
      position: pos ? sessionChronologicalLabel(pos.position, pos.total) : "",
    };
  });

  const unreviewedCancellations = activeBlockSessions.filter((s) => {
    return deriveSessionStatus(s) === "cancelled" && s.charged_free == null && !s.parent_session_id;
  });

  const lapsedSessions = activeBlockSessions.filter(
    (s) => s.lapse_flagged_at && !s.parent_session_id,
  );

  const { data: reviews } = await supabase
    .from("client_reviews")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const extensionHistory = (client as any).block_expiry_extensions ?? [];

  const hasDeliveredSessions = completedSessions.length > 0;

  // BUG-EF-151 — EmptyState must only show when the client has NEVER had a
  // completed session anywhere, not just in the current block.
  const hasAnyCompletedSessions = (sessions ?? []).some(
    (s: any) => deriveSessionStatus(s) === "completed" && !s.parent_session_id,
  );

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
      chronologicalTotal={chronologicalTotal}
      blockExpiryDate={client.block_expiry_date}
      clientNumber={numericId}
      currentUserName={currentUserName}
    />
  );
}
