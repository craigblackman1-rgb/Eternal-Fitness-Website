import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, FileText, Pencil, Plus, Heart, Target, ClipboardList, TriangleAlert, Mail } from "lucide-react";
import type { DBClientComplianceStatus, DBClientGroupType, DBClientPaceMode } from "@/types";
import { PlanAgentTab } from "./PlanAgentTab";

function ComplianceAlert({ status }: { status: DBClientComplianceStatus | null }) {
  if (!status || status === 'clear') return null;
  
  if (status === 'do_not_train') {
    return (
      <div className="p-4 rounded-lg bg-rose/10 border border-rose/20 mb-4">
        <p className="text-rose font-medium">Do Not Train — outstanding paperwork must be resolved before any further sessions.</p>
      </div>
    );
  }
  
  if (status === 'pending_medical') {
    return (
      <div className="p-4 rounded-lg bg-amber-100/50 border border-amber-200 mb-4">
        <p className="text-amber-800 font-medium">Pending Medical Clearance — do not train until clearance is confirmed.</p>
      </div>
    );
  }
  
  // action_needed
  return (
    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mb-4">
      <p className="text-sm text-amber-700">Actions outstanding — see Compliance tab.</p>
    </div>
  );
}

function OutstandingActionsList({ actions }: { actions: string[] | null }) {
  if (!actions || actions.length === 0) return null;
  
  return (
    <ul className="list-none space-y-2 mb-4">
      {actions.map((action, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <TriangleAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <span className="text-foreground">{action}</span>
        </li>
      ))}
    </ul>
  );
}

function GroupTypeLabel({ groupType }: { groupType: DBClientGroupType | null }) {
  if (!groupType) return null;
  return groupType === 'individual_journey' ? 'Individual Journey' : 'Calendar Block';
}

function PaceModeDisplay({ paceMode }: { paceMode: DBClientPaceMode | null }) {
  if (!paceMode) return null;
  
  const label = paceMode === 'fast' ? 'Fast pace' : paceMode === 'medium' ? 'Medium pace' : 'Slow pace';
  const exerciseCount = paceMode === 'fast' ? '~10 exercises per session' : paceMode === 'medium' ? '~8 exercises per session' : '~5–6 exercises per session';
  
  return (
    <span>{label} — {exerciseCount}</span>
  );
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("*, compliance_status, outstanding_actions, group_type, pace_mode").eq("client_number", parseInt(params.id)).single();
  
  if (!client) notFound();
  
  const { data: blocks } = await supabase.from("blocks").select("*").eq("client_id", client.id).order("block_number", { ascending: false });
  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      *,
      blocks!inner(
        block_number,
        client_id
      )
    `)
    .eq("blocks.client_id", client.id)
    .order("session_number", { ascending: false })
    .limit(50);

  if (!client) notFound();

  const p = client.profile;
  const initials = client.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const latestBlock = blocks && blocks.length > 0 ? blocks[0] : null;

  return (
    <div className="space-y-6">
      {/* Header — client identity */}
      <div className="flex items-center gap-4">
        <Link href="/hub/clients" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-rose/15 text-rose flex items-center justify-center text-lg font-bold shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">
              {p?.client?.age && `${p.client.age} yrs`} {p?.client?.gender && `· ${p.client.gender}`}
              {p?.logistics?.sessions_per_week && ` · ${p.logistics.sessions_per_week}x/week`}
              {p?.logistics?.time_tier && ` · ${p.logistics.time_tier}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/hub/clients/${client.client_number}/edit`}>
            <Button variant="outline" className="rounded-full gap-1.5 border-border/60">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/hub/clients/${client.client_number}/blocks/new`}>
            <Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
              <Plus className="h-4 w-4" />
              New Block
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="plan-agent">Plan Agent</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <ComplianceAlert status={client.compliance_status} />
          
          {/* Stats row */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
            <span>Group: <span className="text-foreground font-medium">{client.group_type && <GroupTypeLabel groupType={client.group_type} />}</span></span>
            <span>Pace: <span className="text-foreground font-medium">{client.pace_mode && <PaceModeDisplay paceMode={client.pace_mode} />}</span></span>
            {p?.logistics?.sessions_per_week && <span>Sessions: <span className="text-foreground font-medium">{p.logistics.sessions_per_week}x/week</span></span>}
            {p?.logistics?.time_tier && <span>Tier: <span className="text-foreground font-medium">{p.logistics.time_tier}</span></span>}
          </div>

          <OutstandingActionsList actions={client.outstanding_actions} />

          {/* Active block summary */}
          {latestBlock ? (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Block</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href={`/hub/clients/${client.client_number}/blocks/${latestBlock.id}`}
                  className="flex items-center justify-between group"
                >
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-rose transition-colors">Block {latestBlock.block_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(latestBlock.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Badge
                    variant={latestBlock.status === "approved" || latestBlock.status === "active" ? "default" : latestBlock.status === "draft" ? "secondary" : "outline"}
                    className="capitalize rounded-full"
                  >
                    {latestBlock.status}
                  </Badge>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">No blocks yet</span>
                <Link href={`/hub/clients/${client.client_number}/blocks/new`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Create Block
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Profile */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          {p?.health && (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal/10 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-teal" />
                  </div>
                  Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">GP Clearance</span>
                  <Badge variant={p.health.gp_clearance ? "default" : "destructive"} className="rounded-full">
                    {p.health.gp_clearance ? "Yes" : "No"}
                  </Badge>
                </div>
                {p.health.conditions?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Conditions</span>
                    <p className="text-foreground">{p.health.conditions.join(", ")}</p>
                  </div>
                )}
                {p.health.contraindications?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Contraindications</span>
                    <p className="text-foreground">{p.health.contraindications.join(", ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {p?.goals && (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-dark-navy/10 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-dark-navy" />
                  </div>
                  Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Primary</span>
                  <p className="text-foreground font-medium">{p.goals.primary}</p>
                </div>
                {p.goals.milestones?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Milestones</span>
                    <ul className="list-none space-y-1">
                      {p.goals.milestones.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose/50 mt-1.5 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {p?.notes?.esther_observations && (
            <Card className="shadow-sm border-border/60 rounded-2xl bg-off-white/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate/10 flex items-center justify-center">
                    <ClipboardList className="w-3.5 h-3.5 text-slate" />
                  </div>
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-foreground">{p.notes.esther_observations}</p>
                {p.notes.watch_for && (
                  <div className="mt-3 p-3 rounded-lg bg-rose/5 border border-rose/10">
                    <span className="text-rose font-semibold text-xs uppercase tracking-wide">Watch for</span>
                    <p className="text-rose/80 mt-1">{p.notes.watch_for}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Compliance */}
        <TabsContent value="compliance" className="">
          <Card className="shadow-sm border-border/60 rounded-2xl mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Medical Clearance</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GP Clearance</span>
                <Badge variant={p?.health?.gp_clearance ? "default" : "destructive"} className="rounded-full">
                  {p?.health?.gp_clearance ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 rounded-2xl mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <Badge 
                className={
                  client.compliance_status === 'do_not_train'
                    ? 'bg-rose text-white rounded-full'
                    : client.compliance_status === 'pending_medical'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200 rounded-full'
                    : 'bg-amber-100 text-amber-800 border border-amber-200 rounded-full'
                }
              >
                {client.compliance_status && (
                  client.compliance_status === 'do_not_train'
                    ? 'Do Not Train'
                    : client.compliance_status === 'pending_medical'
                    ? 'Pending Clearance'
                    : 'Action Needed'
                )}
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 rounded-2xl mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Outstanding Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <OutstandingActionsList actions={client.outstanding_actions} />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">PAR-Q</span>
                <p className="text-foreground">No signed PAR-Q on file</p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Agreement</span>
                <p className="text-foreground">No signed agreement on file</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Training */}
        <TabsContent value="training" className="space-y-4 mt-4">
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-rose" />
                </div>
                Training Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <Link
                      key={block.id}
                      href={`/hub/clients/${client.client_number}/blocks/${block.id}`}
                      className="flex items-center justify-between rounded-xl border border-border/60 p-4 transition-all hover:bg-off-white hover:border-rose/20 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-off-white flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground group-hover:text-rose transition-colors" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Block {block.block_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(block.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {block.block_note && ` · ${block.block_note.slice(0, 60)}${block.block_note.length > 60 ? "..." : ""}`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={block.status === "approved" || block.status === "active" ? "default" : block.status === "draft" ? "secondary" : "outline"}
                        className="capitalize rounded-full"
                      >
                        {block.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-rose/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No blocks yet</p>
                  <Link href={`/hub/clients/${client.client_number}/blocks/new`}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      Generate First Block
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Sessions */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Session Log</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions && sessions.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left font-medium text-muted-foreground pb-2">Block</th>
                      <th className="text-left font-medium text-muted-foreground pb-2">Session #</th>
                      <th className="text-left font-medium text-muted-foreground pb-2">Date</th>
                      <th className="text-left font-medium text-muted-foreground pb-2">RPE</th>
                      <th className="text-left font-medium text-muted-foreground pb-2">Fatigue</th>
                      <th className="text-left font-medium text-muted-foreground pb-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b border-border/30 last:border-0">
                        <td className="py-2 text-foreground">{(session?.blocks as any)?.block_number || '-'}</td>
                        <td className="py-2 text-foreground">{session.session_number}</td>
                        <td className="py-2 text-muted-foreground">-</td>
                        <td className="py-2 text-muted-foreground">-</td>
                        <td className="py-2 text-muted-foreground">-</td>
                        <td className="py-2 text-muted-foreground">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">No sessions logged yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Plan Agent */}
        <TabsContent value="plan-agent" className="mt-4">
          <PlanAgentTab
            clientNumber={client.client_number}
            clientName={client.name}
            paceMode={client.pace_mode ?? "medium"}
          />
        </TabsContent>

        {/* Tab 7: Updates */}
        <TabsContent value="updates" className="space-y-4 mt-4">
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">6-Week Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-rose/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate branded 6-week update emails from training data.
                </p>
                <Link href={`/hub/clients/${client.client_number}/updates`}>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                    <Mail className="h-4 w-4" />
                    View Updates
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}