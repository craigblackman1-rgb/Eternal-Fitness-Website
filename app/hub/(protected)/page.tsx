import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconActivity, IconArrowUpRight, IconCalendar, IconCheckCircle, IconFileText, IconUserPlus, IconUsers } from "@/components/icons";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { KpiTile } from "@/components/hub/KpiTile";
import { EmptyState } from "@/components/hub/EmptyState";
import { HubCardHeader } from "@/components/hub/HubCardHeader";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, profile, created_at, client_number")
    .order("created_at", { ascending: false });

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, client_id, block_number, status, created_at, clients!inner(client_number)")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: activeBlocks } = await supabase
    .from("blocks")
    .select("id, block_number, client_id, clients!inner(client_number, name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const activeBlockIds = (activeBlocks ?? []).map((b) => b.id);
  const { data: activeSessions } = activeBlockIds.length > 0
    ? await supabase
        .from("sessions")
        .select("id, block_id, session_number, data")
        .in("block_id", activeBlockIds)
        .order("session_number", { ascending: true })
    : { data: [] as { id: string; block_id: string; session_number: number; data: any }[] };

  const nextUpByBlock = (activeBlocks ?? []).map((block) => {
    const blockSessions = (activeSessions ?? []).filter((s) => s.block_id === block.id);
    const nextSession = blockSessions.find((s) => !s.data?.session_log?.completed_at);
    const completedCount = blockSessions.filter((s) => s.data?.session_log?.completed_at).length;
    return {
      block,
      nextSession,
      completedCount,
      totalCount: blockSessions.length,
    };
  });

  const totalClients = clients?.length ?? 0;
  const draftBlocks = blocks?.filter((b) => b.status === "draft").length ?? 0;
  const approvedBlocks = blocks?.filter((b) => b.status === "approved" || b.status === "active").length ?? 0;
  const totalBlocks = blocks?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Esther — here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/hub/clients/new">
            <Button size="sm" className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
              <IconUserPlus className="w-4 h-4" />
              New Client
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI band */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={<IconUsers className="w-5 h-5" />} label="Total Clients" value={totalClients} />
        <KpiTile icon={<IconFileText className="w-5 h-5" />} label="Draft Blocks" value={draftBlocks} />
        <KpiTile icon={<IconCheckCircle className="w-5 h-5" />} label="Active / Approved" value={approvedBlocks} />
        <KpiTile icon={<IconActivity className="w-5 h-5" />} label="Total Blocks" value={totalBlocks} />
      </div>

      {/* Active Blocks — next session widget */}
      <Card className="shadow-sm border-border/60 rounded-2xl">
        <HubCardHeader icon={<IconCalendar className="w-4 h-4" />} title="Active Blocks — Next Session" />
        <CardContent>
          {nextUpByBlock.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nextUpByBlock.map(({ block, nextSession, completedCount, totalCount }) => {
                const clientNumber = (block as any).clients?.client_number;
                const clientName = (block as any).clients?.name;
                const initials = (clientName ?? "").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                const href = nextSession
                  ? `/hub/clients/${clientNumber}/blocks/${block.id}/sessions/${nextSession.session_number}`
                  : `/hub/clients/${clientNumber}/blocks/${block.id}`;
                return (
                  <Link
                    key={block.id}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-3 transition-all hover:bg-off-white hover:border-rose/20 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose/15 text-rose flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-rose transition-colors">{clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        Block {block.block_number}
                        {nextSession ? ` · Session ${nextSession.session_number}` : " · All sessions logged"}
                        {totalCount > 0 && ` · ${completedCount}/${totalCount} done`}
                      </p>
                    </div>
                    <IconArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No active blocks right now — approve a block to see it here." />
          )}
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Clients */}
        <Card className="lg:col-span-2 shadow-sm border-border/60 rounded-2xl">
          <HubCardHeader
            icon={<IconUsers className="w-4 h-4" />}
            title="Recent Clients"
            action={<Link href="/hub/clients" className="text-sm text-rose hover:underline inline-flex items-center gap-1">View all <IconArrowUpRight className="w-3 h-3" /></Link>}
          />
          <CardContent>
            {clients && clients.length > 0 ? (
              <div className="space-y-1">
                {clients.slice(0, 5).map((client) => {
                  const initials = client.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  const sessionsPerWeek = client.profile?.logistics?.sessions_per_week;
                  const conditions = client.profile?.health?.conditions?.length ?? 0;
                  return (
                    <Link
                      key={client.id}
                      href={`/hub/clients/${client.client_number}`}
                      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-off-white group"
                    >
                      <div className="w-10 h-10 rounded-full bg-rose/15 text-rose flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sessionsPerWeek ? `${sessionsPerWeek}x / week` : "No schedule set"}
                          {conditions > 0 && ` · ${conditions} condition(s)`}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(client.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<IconUsers className="w-7 h-7" />} title="No clients yet" cta={{ label: "Add Your First Client", href: "/hub/clients/new" }} />
            )}
          </CardContent>
        </Card>

        {/* Activity / Overview Sidebar */}
        <div className="space-y-6">
          {/* Block Activity */}
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Recent Blocks" />
            <CardContent>
              {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.slice(0, 5).map((block) => (
                    <Link
                      key={block.id}
                      href={`/hub/clients/${(block as any).clients?.client_number || block.client_id}/blocks/${block.id}`}
                      className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-off-white group"
                    >
                      <span className="flex-1 text-sm font-medium text-foreground">Block {block.block_number}</span>
                      <StatusBadge status={block.status} />
                      <IconArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="No blocks generated yet" />
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border-border/60 rounded-2xl bg-off-white/40">
            <HubCardHeader icon={<IconActivity className="w-4 h-4" />} title="Quick Actions" color="navy" />
            <CardContent className="space-y-2">
              <Link href="/hub/clients/new">
                <Button variant="outline" className="w-full justify-start rounded-full gap-2 text-sm border-border/60 hover:bg-white">
                  <IconUserPlus className="w-4 h-4 text-rose" />
                  Add a new client
                </Button>
              </Link>
              <Link href="/hub/exercises">
                <Button variant="outline" className="w-full justify-start rounded-full gap-2 text-sm border-border/60 hover:bg-white">
                  <IconFileText className="w-4 h-4 text-teal" />
                  Browse exercise library
                </Button>
              </Link>
              <Link href="/hub/clients">
                <Button variant="outline" className="w-full justify-start rounded-full gap-2 text-sm border-border/60 hover:bg-white">
                  <IconUsers className="w-4 h-4 text-slate" />
                  View all clients
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
