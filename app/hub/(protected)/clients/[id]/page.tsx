import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconChevronLeft, IconClipboardList, IconFileText, IconHeart, IconMail, IconPencil, IconPlus, IconTarget, IconTriangleAlert } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
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
          <IconTriangleAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
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
  const latestBlock = blocks && blocks.length > 0
    ? blocks.find((b) => b.status === "active") ?? blocks.find((b) => b.status === "approved") ?? blocks[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Client identity band */}
      <div className="rounded-2xl bg-dark-navy text-white p-6 flex items-center gap-5">
        <Link href="/hub/clients" className="text-white/50 hover:text-white transition-colors shrink-0">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div className="w-16 h-16 rounded-full bg-rose text-white text-xl font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-white/60">
            {p?.client?.age && `${p.client.age} yrs`} {p?.client?.gender && `· ${p.client.gender}`}
            {p?.logistics?.sessions_per_week && ` · ${p.logistics.sessions_per_week}x/week`}
            {p?.logistics?.time_tier && ` · ${p.logistics.time_tier}`}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {client.group_type && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {client.group_type === 'individual_journey' ? 'Individual Journey' : 'Calendar Block'}
              </span>
            )}
            {client.pace_mode && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {client.pace_mode === 'fast' ? 'Fast pace' : client.pace_mode === 'medium' ? 'Medium pace' : 'Slow pace'}
              </span>
            )}
            {p?.logistics?.sessions_per_week && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {p.logistics.sessions_per_week}x/week
              </span>
            )}
            {p?.logistics?.time_tier && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {p.logistics.time_tier}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/hub/clients/${client.client_number}/edit`}>
            <Button variant="outline" className="rounded-full gap-1.5 border-white/20 text-white hover:bg-white/10 bg-transparent">
              <IconPencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/hub/clients/${client.client_number}/blocks/new`}>
            <Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
              <IconPlus className="h-4 w-4" />
              New Block
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-rose data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="profile-compliance" className="rounded-full data-[state=active]:bg-rose data-[state=active]:text-white">Profile & Compliance</TabsTrigger>
          <TabsTrigger value="training" className="rounded-full data-[state=active]:bg-rose data-[state=active]:text-white">Training</TabsTrigger>
          <TabsTrigger value="plan-agent" className="rounded-full data-[state=active]:bg-rose data-[state=active]:text-white">Plan Agent</TabsTrigger>
          <TabsTrigger value="updates" className="rounded-full data-[state=active]:bg-rose data-[state=active]:text-white">Updates</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <ComplianceAlert status={client.compliance_status} />
          
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
              <CardContent>
                <EmptyState title="No blocks yet" cta={{ label: "Create Block", href: `/hub/clients/${client.client_number}/blocks/new` }} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Profile & Compliance */}
        <TabsContent value="profile-compliance" className="space-y-4 mt-4">
          {/* Profile content */}
          {p?.logistics && (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-dark-navy/10 flex items-center justify-center">
                    <IconClipboardList className="w-3.5 h-3.5 text-dark-navy" />
                  </div>
                  Logistics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-muted-foreground block mb-1">Location</span>
                  <p className="text-foreground font-medium capitalize">{p.logistics.training_location?.replace("_", " ") ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Sessions/week</span>
                  <p className="text-foreground font-medium">{p.logistics.sessions_per_week ?? "—"}x</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Time tier</span>
                  <p className="text-foreground font-medium capitalize">{p.logistics.time_tier ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Package</span>
                  <p className="text-foreground font-medium">{p.logistics.package ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Pace mode</span>
                  <p className="text-foreground font-medium"><PaceModeDisplay paceMode={client.pace_mode} /></p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Group type</span>
                  <p className="text-foreground font-medium"><GroupTypeLabel groupType={client.group_type} /></p>
                </div>
              </CardContent>
            </Card>
          )}

          {p?.health && (
            <Card className="shadow-sm border-border/60 rounded-2xl bg-off-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose/10 flex items-center justify-center">
                    <IconHeart className="w-3.5 h-3.5 text-rose" />
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
                {p.health.medications_relevant?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Relevant Medications</span>
                    <p className="text-foreground">{p.health.medications_relevant.join(", ")}</p>
                  </div>
                )}
                {p.health.injury_history?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Injury History</span>
                    <p className="text-foreground">{p.health.injury_history.join(", ")}</p>
                  </div>
                )}
                {p.health.pain_points?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Pain Points</span>
                    <p className="text-foreground">{p.health.pain_points.join(", ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {p?.physical_baseline && (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose/10 flex items-center justify-center">
                    <IconTarget className="w-3.5 h-3.5 text-rose" />
                  </div>
                  Physical Baseline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fitness Level</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium ${
                          n <= (p.physical_baseline.fitness_level ?? 0)
                            ? "bg-rose text-white"
                            : "bg-border/40 text-muted-foreground"
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block mb-1">Lower Body</span>
                    <p className="text-foreground font-medium capitalize">{p.physical_baseline.strength_baseline?.lower_body ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Upper Body</span>
                    <p className="text-foreground font-medium capitalize">{p.physical_baseline.strength_baseline?.upper_body ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Core</span>
                    <p className="text-foreground font-medium capitalize">{p.physical_baseline.strength_baseline?.core ?? "—"}</p>
                  </div>
                </div>
                {p.physical_baseline.movement_quality_flags?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Movement Quality Flags</span>
                    <ul className="list-none space-y-1">
                      {p.physical_baseline.movement_quality_flags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <IconTriangleAlert className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {p?.goals && (
            <Card className="shadow-sm border-border/60 rounded-2xl bg-off-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose/10 flex items-center justify-center">
                    <IconTarget className="w-3.5 h-3.5 text-rose" />
                  </div>
                  Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Primary</span>
                  <p className="text-foreground font-medium capitalize">{p.goals.primary?.replace("_", " ") ?? "—"}</p>
                </div>
                {p.goals.secondary?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Secondary</span>
                    <p className="text-foreground">{p.goals.secondary.join(", ")}</p>
                  </div>
                )}
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

          {p?.programming_adaptations && p.programming_adaptations.length > 0 && (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center">
                    <IconClipboardList className="w-3.5 h-3.5 text-amber" />
                  </div>
                  Programming Adaptations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-none space-y-2">
                  {p.programming_adaptations.map((ad, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber mt-2 shrink-0" />
                      <span className="text-foreground">{ad}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(p?.notes?.esther_observations || p?.notes?.motivation_notes || p?.notes?.watch_for) && (
            <Card className="shadow-sm border-border/60 rounded-2xl bg-off-white/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate/10 flex items-center justify-center">
                    <IconClipboardList className="w-3.5 h-3.5 text-slate" />
                  </div>
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {p.notes.esther_observations && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Observations</span>
                    <p className="text-foreground">{p.notes.esther_observations}</p>
                  </div>
                )}
                {p.notes.motivation_notes && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Motivation</span>
                    <p className="text-foreground">{p.notes.motivation_notes}</p>
                  </div>
                )}
                {p.notes.watch_for && (
                  <div className="mt-1 p-3 rounded-lg bg-rose/5 border border-rose/10">
                    <span className="text-rose font-semibold text-xs uppercase tracking-wide">Watch for</span>
                    <p className="text-rose/80 mt-1">{p.notes.watch_for}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

        {/* Tab 3: Training (Blocks + Sessions) */}
        <TabsContent value="training" className="space-y-4 mt-4">
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center">
                  <IconFileText className="w-4 h-4 text-rose" />
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
                          <IconFileText className="h-5 w-5 text-muted-foreground group-hover:text-rose transition-colors" />
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
                <EmptyState icon={<IconFileText className="w-7 h-7" />} title="No blocks yet" cta={{ label: "Generate First Block", href: `/hub/clients/${client.client_number}/blocks/new` }} />
              )}
            </CardContent>
          </Card>

          {/* Separator */}
          <div className="border-t border-border/60 my-2" />

          {/* Sessions content */}
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
                    {sessions.map((session) => {
                      const log = (session.data as any)?.session_log;
                      return (
                        <tr key={session.id} className="border-b border-border/30 last:border-0">
                          <td className="py-2 text-foreground">{(session?.blocks as any)?.block_number || '-'}</td>
                          <td className="py-2 text-foreground">{session.session_number}</td>
                          <td className="py-2 text-muted-foreground">
                            {log?.completed_at
                              ? new Date(log.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                              : "—"}
                          </td>
                          <td className="py-2 text-muted-foreground">{log?.rpe ?? "—"}</td>
                          <td className="py-2 text-muted-foreground capitalize">{log?.fatigue ?? "—"}</td>
                          <td className="py-2 text-muted-foreground max-w-[240px] truncate">{log?.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <EmptyState title="No sessions logged yet." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Plan Agent */}
        <TabsContent value="plan-agent" className="mt-4">
          <PlanAgentTab
            clientNumber={client.client_number}
            clientName={client.name}
            paceMode={client.pace_mode ?? "medium"}
          />
        </TabsContent>

        {/* Tab 5: Updates */}
        <TabsContent value="updates" className="space-y-4 mt-4">
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">6-Week Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center">
                  <IconMail className="w-7 h-7 text-rose/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate branded 6-week update emails from training data.
                </p>
                <Link href={`/hub/clients/${client.client_number}/updates`}>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                    <IconMail className="h-4 w-4" />
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
