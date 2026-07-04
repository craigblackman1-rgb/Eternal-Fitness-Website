import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconChevronLeft, IconClipboardList, IconFileText, IconHeart, IconMail, IconPencil, IconPlus, IconTarget, IconTriangleAlert } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { HubCardHeader } from "@/components/hub/HubCardHeader";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { HubAlert } from "@/components/hub/HubAlert";
import { lookupStatus } from "@/lib/hubStatus";
import { computeComplianceFlags } from "@/lib/compliance";
import type { DBClientGroupType, DBClientPaceMode } from "@/types";
import { PlanAgentTab } from "./PlanAgentTab";
import { ClientDetailTabs } from "./ClientDetailTabs";
import { GpLetterCard } from "@/components/hub/GpLetterCard";
import { DocumentRegister } from "@/components/hub/DocumentRegister";
import { ClinicalComplianceCard } from "@/components/hub/ClinicalComplianceCard";
import { PackagePaymentsCard } from "@/components/hub/PackagePaymentsCard";

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

function OutstandingActionsInline({ actions }: { actions: string[] | null }) {
  if (!actions || actions.length === 0) return null;

  return (
    <ul className="mt-1.5 space-y-0.5">
      {actions.map((action, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <IconTriangleAlert className="w-3.5 h-3.5 shrink-0" />
          <span>{action}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("*, compliance_status, outstanding_actions, group_type, pace_mode").eq("client_number", parseInt(params.id)).single();

  if (!client) notFound();

  const { data: parqs } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const { data: agreements } = await supabase
    .from("signed_agreements")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const { data: clientDocuments } = await supabase
    .from("client_documents")
    .select("id, kind, title, status, version, created_at, client_signature, trainer_signature, requires_trainer_signature")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const latestParq = parqs?.[0] ?? null;
  const latestAgreement = agreements?.[0] ?? null;

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

  const metaParts: string[] = [];
  metaParts.push(`Client #${client.client_number}`);
  if (p?.logistics?.sessions_per_week) metaParts.push(`${p.logistics.sessions_per_week}x/week`);
  if (p?.logistics?.package) metaParts.push(p.logistics.package);

  const flags = computeComplianceFlags({ client, latestParq: latestParq ?? null, latestAgreement: latestAgreement ?? null });
  const complianceLookup = lookupStatus(flags.effectiveStatus);
  const gpClearance = p?.health?.gp_clearance;
  const manualActions = client.outstanding_actions ?? [];
  const outstandingCount = flags.autoOutstanding.length + manualActions.length;

  const rightRail = (
    <div className="lg:col-span-4 space-y-5">
      <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
        <HubCardHeader icon={<IconClipboardList className="w-4 h-4" />} title="Status" color="slate" />
        <CardContent className="space-y-0 pt-0">
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">Compliance</span>
            {complianceLookup ? <StatusBadge status={flags.effectiveStatus} /> : <span className="text-muted-foreground">—</span>}
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">GP Clearance</span>
            {p?.health ? (
              <Badge variant={gpClearance ? "default" : "destructive"} className="rounded-full">
                {gpClearance ? "Yes" : "No"}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">Outstanding actions</span>
            <span className="font-medium text-foreground">{outstandingCount}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
        <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Active Block" />
        <CardContent className="pt-0">
          {latestBlock ? (
            <Link
              href={`/hub/clients/${client.client_number}/blocks/${latestBlock.id}`}
              className="flex items-center justify-between group py-1"
            >
              <div>
                <p className="font-semibold text-sm text-foreground group-hover:text-rose transition-colors">Block {latestBlock.block_number}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(latestBlock.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <StatusBadge status={latestBlock.status} />
            </Link>
          ) : (
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-muted-foreground">No blocks yet</span>
              <Link href={`/hub/clients/${client.client_number}?tab=plan-agent`} className="text-rose font-medium hover:underline">
                Create Block
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
        <HubCardHeader icon={<IconTarget className="w-4 h-4" />} title="Quick Actions" color="amber" />
        <CardContent className="space-y-1 pt-0">
          <Link href={`/hub/clients/${client.client_number}/edit`} className="rounded-lg px-2.5 py-2 hover:bg-[var(--hub-hover)] text-sm font-medium flex items-center gap-2.5">
            <IconPencil className="w-4 h-4 text-muted-foreground" />
            Edit client
          </Link>
          <Link href={`/hub/clients/${client.client_number}?tab=plan-agent`} className="rounded-lg px-2.5 py-2 hover:bg-[var(--hub-hover)] text-sm font-medium flex items-center gap-2.5">
            <IconPlus className="w-4 h-4 text-muted-foreground" />
            Plan a block
          </Link>
          <Link href={`/hub/clients/${client.client_number}/updates`} className="rounded-lg px-2.5 py-2 hover:bg-[var(--hub-hover)] text-sm font-medium flex items-center gap-2.5">
            <IconMail className="w-4 h-4 text-muted-foreground" />
            Updates
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm px-5 py-4 flex items-center gap-4">
        <Link href="/hub/clients" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div className="w-12 h-12 rounded-full bg-rose/15 text-rose font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{client.name}</h1>
          <p className="text-sm text-muted-foreground">{metaParts.join(" · ")}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {client.group_type && (
              <span className="inline-flex rounded-md bg-[var(--hub-canvas)] border border-[var(--hub-border)] px-2 py-0.5 text-xs text-slate">
                <GroupTypeLabel groupType={client.group_type} />
              </span>
            )}
            {client.pace_mode && (
              <span className="inline-flex rounded-md bg-[var(--hub-canvas)] border border-[var(--hub-border)] px-2 py-0.5 text-xs text-slate">
                {client.pace_mode === 'fast' ? 'Fast pace' : client.pace_mode === 'medium' ? 'Medium pace' : 'Slow pace'}
              </span>
            )}
            {p?.logistics?.time_tier && (
              <span className="inline-flex rounded-md bg-[var(--hub-canvas)] border border-[var(--hub-border)] px-2 py-0.5 text-xs text-slate capitalize">
                {p.logistics.time_tier}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/hub/clients/${client.client_number}/edit`}>
            <Button variant="outline" className="border border-[var(--hub-border)] rounded-lg px-3.5 py-1.5 h-auto text-sm font-medium hover:bg-[var(--hub-hover)] gap-1.5">
              <IconPencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/hub/clients/${client.client_number}?tab=plan-agent`}>
            <Button className="bg-rose hover:bg-rose/90 text-white rounded-lg px-3.5 py-1.5 h-auto text-sm font-semibold gap-1.5">
              <IconPlus className="h-4 w-4" />
              Plan Block
            </Button>
          </Link>
        </div>
      </div>

      {/* Danger / warning banner */}
      {flags.effectiveStatus === "do_not_train" && (
        <HubAlert severity="danger" title="Do Not Train">
          Outstanding paperwork must be resolved before any further sessions.
          <OutstandingActionsInline actions={flags.autoOutstanding} />
          <OutstandingActionsInline actions={manualActions} />
        </HubAlert>
      )}
      {(flags.effectiveStatus === "pending_medical" || flags.effectiveStatus === "action_needed") && (
        <HubAlert severity="warning" title={lookupStatus(flags.effectiveStatus)?.label ?? "Action Needed"}>
          {flags.effectiveStatus === "pending_medical"
            ? "Do not train until clearance is confirmed."
            : "Actions outstanding — see Compliance tab."}
          <OutstandingActionsInline actions={flags.autoOutstanding} />
          <OutstandingActionsInline actions={manualActions} />
        </HubAlert>
      )}

      <ClientDetailTabs>
        <TabsList className="w-full justify-start gap-1 rounded-none border-b border-[var(--hub-border)] bg-transparent p-0 h-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Overview</TabsTrigger>
          <TabsTrigger value="profile-compliance" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Profile & Compliance</TabsTrigger>
          <TabsTrigger value="training" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Training</TabsTrigger>
          <TabsTrigger value="plan-agent" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Plan Agent</TabsTrigger>
          <TabsTrigger value="updates" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Updates</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-5">
              <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
                <HubCardHeader icon={<IconClipboardList className="w-4 h-4" />} title="Snapshot" color="navy" />
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Sessions/week</span>
                      <span className="font-medium text-foreground">{p?.logistics?.sessions_per_week ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Package</span>
                      <span className="font-medium text-foreground">{p?.logistics?.package ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Primary Goal</span>
                      <span className="font-medium text-foreground capitalize">{p?.goals?.primary?.replace("_", " ") ?? "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {rightRail}
          </div>
        </TabsContent>

        {/* Tab 2: Profile & Compliance */}
        <TabsContent value="profile-compliance" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-5">
              {p?.logistics && (
                <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
                  <HubCardHeader icon={<IconClipboardList className="w-4 h-4" />} title="Logistics" color="navy" />
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Location</span>
                        <span className="font-medium text-foreground capitalize">{p.logistics.training_location?.replace("_", " ") ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Sessions/week</span>
                        <span className="font-medium text-foreground">{p.logistics.sessions_per_week ?? "—"}x</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Time tier</span>
                        <span className="font-medium text-foreground capitalize">{p.logistics.time_tier ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Package</span>
                        <span className="font-medium text-foreground">{p.logistics.package ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Pace mode</span>
                        <span className="font-medium text-foreground"><PaceModeDisplay paceMode={client.pace_mode} /></span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Group type</span>
                        <span className="font-medium text-foreground"><GroupTypeLabel groupType={client.group_type} /></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {p?.health && (
                <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
                  <HubCardHeader icon={<IconHeart className="w-4 h-4" />} title="Health" />
                  <CardContent className="space-y-3 text-sm pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">GP Clearance</span>
                      <Badge variant={p.health.gp_clearance ? "default" : "destructive"} className="rounded-full">
                        {p.health.gp_clearance ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                      {p.health.conditions?.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-0.5">Conditions</span>
                          <span className="font-medium text-foreground">{p.health.conditions.join(", ")}</span>
                        </div>
                      )}
                      {p.health.contraindications?.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-0.5">Contraindications</span>
                          <span className="font-medium text-foreground">{p.health.contraindications.join(", ")}</span>
                        </div>
                      )}
                      {p.health.medications_relevant?.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-0.5">Relevant Medications</span>
                          <span className="font-medium text-foreground">{p.health.medications_relevant.join(", ")}</span>
                        </div>
                      )}
                      {p.health.pain_points?.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-0.5">Pain Points</span>
                          <span className="font-medium text-foreground">{p.health.pain_points.join(", ")}</span>
                        </div>
                      )}
                    </div>
                    {p.health.injury_history?.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1.5">Injury History</span>
                        <div className="overflow-x-auto rounded-lg border border-[var(--hub-border)]">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-canvas)] text-xs text-muted-foreground">
                                <th className="px-3 py-1.5 text-left font-medium">Date</th>
                                <th className="px-3 py-1.5 text-left font-medium">Description</th>
                                <th className="px-3 py-1.5 text-left font-medium">Body Area</th>
                                <th className="px-3 py-1.5 text-left font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.health.injury_history.map((injury: { id: string; date: string | null; description: string; body_area: string; status: string }) => (
                                <tr key={injury.id} className="border-b border-[var(--hub-border)] last:border-0">
                                  <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                                    {injury.date ? new Date(injury.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                  </td>
                                  <td className="px-3 py-1.5 text-foreground">{injury.description || "—"}</td>
                                  <td className="px-3 py-1.5 text-foreground">{injury.body_area || "—"}</td>
                                  <td className="px-3 py-1.5">
                                    <Badge
                                      variant={injury.status === "active" ? "destructive" : injury.status === "monitoring" ? "secondary" : "default"}
                                      className="rounded-full capitalize"
                                    >
                                      {injury.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {p?.physical_baseline && (
                <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
                  <HubCardHeader icon={<IconTarget className="w-4 h-4" />} title="Physical Baseline" />
                  <CardContent className="space-y-3 text-sm pt-0">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Lower Body</span>
                        <span className="font-medium text-foreground capitalize">{p.physical_baseline.strength_baseline?.lower_body ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Upper Body</span>
                        <span className="font-medium text-foreground capitalize">{p.physical_baseline.strength_baseline?.upper_body ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Core</span>
                        <span className="font-medium text-foreground capitalize">{p.physical_baseline.strength_baseline?.core ?? "—"}</span>
                      </div>
                    </div>
                    {p.physical_baseline.movement_quality_flags?.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Movement Quality Flags</span>
                        <ul className="list-none space-y-1">
                          {p.physical_baseline.movement_quality_flags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
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
                <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
                  <HubCardHeader icon={<IconTarget className="w-4 h-4" />} title="Goals" />
                  <CardContent className="space-y-3 text-sm pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Primary</span>
                        <span className="font-medium text-foreground capitalize">{p.goals.primary?.replace("_", " ") ?? "—"}</span>
                      </div>
                      {p.goals.secondary?.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-0.5">Secondary</span>
                          <span className="font-medium text-foreground">{p.goals.secondary.join(", ")}</span>
                        </div>
                      )}
                    </div>
                    {p.goals.milestones?.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Milestones</span>
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
                <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
                  <HubCardHeader icon={<IconClipboardList className="w-4 h-4" />} title="Programming Adaptations" color="amber" />
                  <CardContent className="pt-0">
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
                <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
                  <HubCardHeader icon={<IconClipboardList className="w-4 h-4" />} title="Notes" color="slate" />
                  <CardContent className="space-y-3 text-sm pt-0">
                    {p.notes.esther_observations && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Observations</span>
                        <p className="text-foreground">{p.notes.esther_observations}</p>
                      </div>
                    )}
                    {p.notes.motivation_notes && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">Motivation</span>
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

              <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
                <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Compliance & Documents" color="teal" />
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">Compliance Status</span>
                    {complianceLookup ? <StatusBadge status={flags.effectiveStatus} /> : <span className="font-medium text-foreground">—</span>}
                  </div>

                  <div className="pt-1 border-t border-[var(--hub-border)]">
                    <div className="pt-3">
                      <ClinicalComplianceCard
                        clientId={client.id}
                        initial={{
                          medical_clearance_status: client.medical_clearance_status ?? "not_required",
                          risk_level: client.risk_level ?? "low",
                          exercise_modifications: client.exercise_modifications ?? null,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[var(--hub-border)]">
                    <div className="pt-3">
                      <DocumentRegister
                        clientNumber={client.client_number}
                        parqs={parqs ?? []}
                        agreements={agreements ?? []}
                        documents={clientDocuments ?? []}
                      />
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[var(--hub-border)]">
                    <span className="text-xs text-muted-foreground block mb-2 pt-3">GP Clearance Letter</span>
                    <GpLetterCard
                      clientId={client.id}
                      gpLetterStatus={client.gp_letter_status}
                      requestedDate={client.gp_letter_requested_date}
                      receivedDate={client.gp_letter_received_date}
                    />
                  </div>

                  {outstandingCount > 0 && (
                    <div className="pt-1 border-t border-[var(--hub-border)]">
                      <span className="text-xs text-muted-foreground block mb-1 pt-3">Outstanding</span>
                      <ul className="list-none space-y-1.5">
                        {flags.autoOutstanding.map((action, i) => (
                          <li key={`auto-${i}`} className="flex items-start gap-2 text-sm">
                            <IconTriangleAlert className="h-3.5 w-3.5 text-rose mt-0.5 shrink-0" />
                            <span className="text-foreground">{action}</span>
                          </li>
                        ))}
                        {manualActions.map((action, i) => (
                          <li key={`manual-${i}`} className="flex items-start gap-2 text-sm">
                            <IconTriangleAlert className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <span className="text-foreground">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <PackagePaymentsCard
                clientId={client.id}
                initial={{
                  package_type: client.package_type ?? null,
                  sessions_purchased: client.sessions_purchased ?? null,
                  sessions_used: client.sessions_used ?? 0,
                  sessions_remaining: client.sessions_remaining ?? null,
                  session_duration: client.session_duration ?? 60,
                  payment_method: client.payment_method ?? null,
                  payment_status: client.payment_status ?? "pending",
                  block_expiry_date: client.block_expiry_date ?? null,
                  client_status: client.client_status ?? "active",
                  referral_source: client.referral_source ?? null,
                }}
              />
            </div>
            {rightRail}
          </div>
        </TabsContent>

        {/* Tab 3: Training (Blocks + Sessions) */}
        <TabsContent value="training" className="space-y-4 mt-4">
          <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
            <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Training Blocks" />
            <CardContent className="pt-0">
              {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <Link
                      key={block.id}
                      href={`/hub/clients/${client.client_number}/blocks/${block.id}`}
                      className="flex items-center justify-between rounded-xl border border-[var(--hub-border)] py-2 px-4 transition-all hover:bg-[var(--hub-hover)] hover:border-rose/20 group"
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
                      <StatusBadge status={block.status} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg py-2 px-1 text-sm">
                  <span className="text-muted-foreground">No blocks yet</span>
                  <Link href={`/hub/clients/${client.client_number}?tab=plan-agent`} className="text-rose font-medium hover:underline">
                    Create Block
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Separator */}
          <div className="border-t border-[var(--hub-border)] my-2" />

          {/* Sessions content */}
          <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Session Log</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions && sessions.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--hub-border)]">
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
          <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">6-Week Updates</CardTitle>
            </CardHeader>
            <CardContent>
                <EmptyState
                  icon={<IconMail className="w-7 h-7" />}
                  title="6-Week Updates"
                  description="Generate branded 6-week update emails from training data."
                  cta={{ label: "View Updates", href: `/hub/clients/${client.client_number}/updates` }}
                />
            </CardContent>
          </Card>
        </TabsContent>
      </ClientDetailTabs>
    </div>
  );
}
