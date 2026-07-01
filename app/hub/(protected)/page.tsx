import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconActivity, IconArrowUpRight, IconCalendar, IconCheckCircle, IconFileText, IconPlus, IconUserPlus, IconUsers } from "@/components/icons";
import type { DBClient, DBBlock } from "@/types";

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: "rose" | "teal" | "navy" | "slate" }) {
  const map = {
    rose: { bg: "bg-rose/10", icon: "text-rose", value: "text-foreground" },
    teal: { bg: "bg-teal/10", icon: "text-teal", value: "text-foreground" },
    navy: { bg: "bg-dark-navy/10", icon: "text-dark-navy", value: "text-foreground" },
    slate: { bg: "bg-slate/10", icon: "text-slate", value: "text-foreground" },
  };
  const colors = map[accent];
  return (
    <Card className="shadow-sm border-border/60 rounded-2xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
          <span className={colors.icon}>{icon}</span>
        </div>
        <div>
          <p className={`text-2xl font-bold tracking-tight ${colors.value}`}>{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active" || status === "approved" ? "bg-rose"
    : status === "draft" ? "bg-slate"
    : "bg-border";
  return <span className={`w-2 h-2 rounded-full inline-block ${color}`} />;
}

function BlockBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
    draft:    { variant: "secondary", label: "Draft" },
    active:   { variant: "default",  label: "Active" },
    approved: { variant: "default",  label: "Approved" },
  };
  const fallback = { variant: "outline" as const, label: status };
  const { variant, label } = map[status] ?? fallback;
  return <Badge variant={variant} className="rounded-full">{label}</Badge>;
}

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

  const totalClients = clients?.length ?? 0;
  const draftBlocks = blocks?.filter((b) => b.status === "draft").length ?? 0;
  const approvedBlocks = blocks?.filter((b) => b.status === "approved" || b.status === "active").length ?? 0;
  const totalBlocks = blocks?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header — editorial style matching website */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Esther — here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/hub/clients/new">
            <Button size="sm" className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
              <IconUserPlus className="w-4 h-4" />
              New Client
            </Button>
          </Link>
          <Link href="/hub/clients/new" className="hidden sm:block">
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 border-border/60">
              <IconCalendar className="w-4 h-4" />
              Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row — branded colors */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<IconUsers className="w-5 h-5" />} label="Total Clients" value={totalClients} accent="rose" />
        <StatCard icon={<IconFileText className="w-5 h-5" />} label="Draft Blocks" value={draftBlocks} accent="slate" />
        <StatCard icon={<IconCheckCircle className="w-5 h-5" />} label="Active / Approved" value={approvedBlocks} accent="teal" />
        <StatCard icon={<IconActivity className="w-5 h-5" />} label="Total Blocks" value={totalBlocks} accent="navy" />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Clients */}
        <Card className="lg:col-span-2 shadow-sm border-border/60 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center">
                <IconUsers className="w-4 h-4 text-rose" />
              </div>
              Recent Clients
            </CardTitle>
            <Link href="/hub/clients" className="text-sm text-rose hover:underline inline-flex items-center gap-1">
              View all <IconArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
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
              <div className="flex flex-col items-center gap-4 py-10">
                <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center">
                  <IconUsers className="w-7 h-7 text-rose/50" />
                </div>
                <p className="text-sm text-muted-foreground">No clients yet</p>
                <Link href="/hub/clients/new">
                  <Button size="sm" className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
                    <IconPlus className="w-4 h-4" />
                    Add Your First Client
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity / Overview Sidebar */}
        <div className="space-y-6">
          {/* Block Activity */}
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
                  <IconFileText className="w-4 h-4 text-teal" />
                </div>
                Recent Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.slice(0, 5).map((block) => (
                    <Link
                      key={block.id}
                      href={`/hub/clients/${(block as any).clients?.client_number || block.client_id}/blocks/${block.id}`}
                      className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-off-white group"
                    >
                      <StatusDot status={block.status} />
                      <span className="flex-1 text-sm font-medium text-foreground">Block {block.block_number}</span>
                      <BlockBadge status={block.status} />
                      <IconArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blocks generated yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border-border/60 rounded-2xl bg-off-white/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-dark-navy/10 flex items-center justify-center">
                  <IconActivity className="w-4 h-4 text-dark-navy" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
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
