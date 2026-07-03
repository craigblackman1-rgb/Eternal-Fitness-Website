import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HubCardHeader } from "@/components/hub/HubCardHeader";
import { KpiTile } from "@/components/hub/KpiTile";
import { StatusBadge } from "@/components/hub/StatusBadge";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPrinter,
  IconFileText,
  IconClipboardList,
  IconCheckCircle,
  IconCalendar,
  IconDumbbell,
} from "@/components/icons";
import { DeleteBlockButton } from "./delete-block-button";
import { ExportSpreadsheetButton } from "./export-spreadsheet";
import type { Session } from "@/types";

// Phase colors — brand-consistent (rose, teal, slate, navy, off-white)
const phaseColors: Record<string, string> = {
  foundation: "bg-teal/10 text-teal",
  build: "bg-rose/10 text-rose",
  develop: "bg-dark-navy/10 text-dark-navy",
  peak: "bg-rose text-white",
  deload: "bg-slate/10 text-slate",
};

const phaseTimeline = [
  { label: "Foundation", weeks: "Wk 1-2", phase: "foundation" },
  { label: "Build", weeks: "Wk 3", phase: "build" },
  { label: "Develop", weeks: "Wk 4", phase: "develop" },
  { label: "Peak", weeks: "Wk 5", phase: "peak" },
  { label: "Deload", weeks: "Wk 6", phase: "deload" },
];

const archetypeInfo: Record<string, { name: string; tint: string }> = {
  A: { name: "Mobility & Movement", tint: "bg-teal/10 text-teal" },
  B: { name: "Strength & Stability", tint: "bg-rose/10 text-rose" },
  C: { name: "Power & Conditioning", tint: "bg-dark-navy/10 text-dark-navy" },
};

interface SessionRow {
  id: string;
  block_id: string;
  session_number: number;
  archetype: string;
  week: number;
  phase: string;
  data: Session;
}

function exerciseCount(session: SessionRow): number {
  const studio = session.data?.versions?.studio;
  if (!studio) return 0;
  return (studio.warm_up?.length || 0) + (studio.main_block?.length || 0) + (studio.cooldown?.length || 0);
}

export default async function BlockViewPage({
  params,
}: {
  params: { id: string; blockId: string };
}) {
  const supabase = createClient();

  const { data: block } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", params.blockId)
    .single();

  if (!block) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("name, client_number")
    .eq("client_number", parseInt(params.id))
    .single();

  const { data: sessionsData } = await supabase
    .from("sessions")
    .select("*")
    .eq("block_id", params.blockId)
    .order("session_number", { ascending: true });

  const sessions = (sessionsData || []) as SessionRow[];
  const clientId = client?.client_number || params.id;

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.data?.session_log?.completed_at).length;
  const archetypeCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.archetype] = (acc[s.archetype] || 0) + 1;
    return acc;
  }, {});
  const archetypeMix = ["A", "B", "C"]
    .filter((a) => archetypeCounts[a])
    .map((a) => `${a} ${archetypeCounts[a]}`)
    .join(" · ");

  const weeks = Array.from(new Set(sessions.map((s) => s.week))).sort((a, b) => a - b);
  const sessionsByWeek = weeks.map((week) => ({
    week,
    sessions: sessions.filter((s) => s.week === week),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${clientId}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center">
            <IconFileText className="w-6 h-6 text-rose" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Block {block.block_number}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{client?.name || "Client"}</span>
              <span>·</span>
              <span>Created {new Date(block.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              <StatusBadge status={block.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/hub/clients/${clientId}/blocks/${params.blockId}/print`}>
            <Button variant="outline" className="rounded-full gap-1.5 border-border/60">
              <IconPrinter className="h-4 w-4" />
              Print
            </Button>
          </Link>
          {block.status === "draft" && (
            <Link href={`/hub/clients/${clientId}/blocks/${params.blockId}/review`}>
              <Button className="rounded-full bg-rose hover:bg-rose/90 text-white">Review & Approve</Button>
            </Link>
          )}
          <ExportSpreadsheetButton
            blockId={params.blockId}
            blockNumber={block.block_number}
            clientName={client?.name || "Client"}
          />
          <DeleteBlockButton clientId={clientId} blockId={params.blockId} />
        </div>
      </div>

      {/* Summary band */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon={<IconClipboardList className="h-5 w-5" />}
          label="Sessions"
          value={totalSessions}
          statusToken="primary"
        />
        <KpiTile
          icon={<IconCheckCircle className="h-5 w-5" />}
          label="Completed"
          value={`${completedSessions}/${totalSessions}`}
          statusToken="success"
        />
        <KpiTile
          icon={<IconCalendar className="h-5 w-5" />}
          label="Weeks"
          value="6"
          statusToken="neutral"
        />
        <KpiTile
          icon={<IconDumbbell className="h-5 w-5" />}
          label="Archetype Mix"
          value={archetypeMix || "—"}
          statusToken="primary"
        />
      </div>

      {/* Phase timeline */}
      <div className="flex gap-2">
        {phaseTimeline.map((p) => (
          <div
            key={p.phase}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-center ${phaseColors[p.phase] || "bg-muted text-muted-foreground"}`}
          >
            {p.label} {p.weeks}
          </div>
        ))}
      </div>

      {/* Block Note */}
      {block.block_note && (
        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <HubCardHeader icon={<IconFileText className="h-4 w-4" />} title="Block Note" color="slate" />
          <CardContent>
            <p className="text-sm text-foreground">{block.block_note}</p>
          </CardContent>
        </Card>
      )}

      {/* Sessions grouped by week */}
      <div className="space-y-6">
        {sessionsByWeek.map(({ week, sessions: weekSessions }) => {
          const weekPhase = weekSessions[0]?.phase || "foundation";
          return (
            <div key={week} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">Week {week}</span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${phaseColors[weekPhase] || "bg-muted text-muted-foreground"}`}>
                  {weekPhase}
                </span>
                <span className="text-xs text-muted-foreground">
                  {weekSessions.length} session{weekSessions.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="rounded-2xl border border-[var(--hub-border)] bg-[var(--hub-card)] shadow-sm divide-y divide-[var(--hub-border)]">
                {weekSessions.map((session) => {
                  const info = archetypeInfo[session.archetype];
                  const focusLabel = session.data?.focus_label || info?.name || "—";
                  const count = exerciseCount(session);
                  const completedAt = session.data?.session_log?.completed_at;

                  return (
                    <Link
                      key={session.id}
                      href={`/hub/clients/${clientId}/blocks/${params.blockId}/sessions/${session.session_number}`}
                      className="group flex items-center gap-4 px-4 py-3 hover:bg-[var(--hub-hover)] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--hub-hover)] border border-[var(--hub-border)] flex items-center justify-center text-xs font-bold shrink-0">
                        {session.session_number}
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold shrink-0 ${info?.tint || "bg-muted text-muted-foreground"}`}>
                        {session.archetype} · {info?.name || "Session"}
                      </span>
                      <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                        {focusLabel}
                      </span>
                      {count > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {count} exercises
                        </span>
                      )}
                      {completedAt ? (
                        <span className="bg-[var(--status-success-bg)] text-[var(--status-success)] rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0">
                          Done
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">Not logged</span>
                      )}
                      <IconChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
