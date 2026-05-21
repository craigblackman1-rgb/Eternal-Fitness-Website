import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, CheckCircle, Activity, Plus, ArrowUpRight, UserPlus, Calendar } from "lucide-react";
import type { DBClient, DBBlock } from "@/types";

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: "primary" | "accent" | "foreground" | "muted" }) {
  const map = {
    primary: "bg-rose/10 text-rose",
    accent: "bg-rose/10 text-rose",
    foreground: "bg-foreground/5 text-foreground",
    muted: "bg-border/50 text-muted-foreground",
  };
  return (
    <Card className="shadow-sm border-muted">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${map[accent]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active" || status === "approved" ? "bg-rose"
    : status === "draft" ? "bg-rose"
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
  return <Badge variant={variant}>{label}</Badge>;
}

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, profile, created_at")
    .order("created_at", { ascending: false });

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, client_id, block_number, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const totalClients = clients?.length ?? 0;
  const draftBlocks = blocks?.filter((b) => b.status === "draft").length ?? 0;
  const approvedBlocks = blocks?.filter((b) => b.status === "approved" || b.status === "active").length ?? 0;
  const totalBlocks = blocks?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Esther</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/hub/clients/new">
            <Button size="sm" className="rounded-full gap-1.5">
              <UserPlus className="w-4 h-4" />
              New Client
            </Button>
          </Link>
          <Link href="/hub/clients/new" className="hidden sm:block">
            <Button size="sm" variant="outline" className="rounded-full gap-1.5">
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Clients" value={totalClients} accent="primary" />
        <StatCard icon={<FileText className="w-5 h-5" />} label="Draft Blocks" value={draftBlocks} accent="accent" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Active / Approved" value={approvedBlocks} accent="foreground" />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Total Blocks" value={totalBlocks} accent="muted" />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Clients */}
        <Card className="lg:col-span-2 shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-4 h-4 text-rose" />
              Recent Clients
            </CardTitle>
            <Link href="/hub/clients" className="text-sm text-rose hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
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
                      href={`/hub/clients/${client.id}`}
                      className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/70 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-rose/20 text-rose flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
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
                <Users className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No clients yet</p>
                <Link href="/hub/clients/new">
                  <Button size="sm" className="rounded-full gap-1.5">
                    <Plus className="w-4 h-4" />
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
          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose" />
                Recent Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.slice(0, 5).map((block) => (
                    <Link
                      key={block.id}
                      href={`/hub/clients/${block.client_id}/blocks/${block.id}`}
                      className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/70 group"
                    >
                      <StatusDot status={block.status} />
                      <span className="flex-1 text-sm font-medium text-foreground">Block {block.block_number}</span>
                      <BlockBadge status={block.status} />
                      <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/hub/clients/new">
                <Button variant="outline" className="w-full justify-start rounded-full gap-2 text-sm">
                  <UserPlus className="w-4 h-4 text-rose" />
                  Add a new client
                </Button>
              </Link>
              <Link href="/hub/exercises">
                <Button variant="outline" className="w-full justify-start rounded-full gap-2 text-sm">
                  <FileText className="w-4 h-4 text-rose" />
                  Browse exercise library
                </Button>
              </Link>
              <Link href="/hub/clients">
                <Button variant="outline" className="w-full justify-start rounded-full gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
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
