import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconChevronLeft, IconClipboardList, IconFileText, IconHeart, IconMail, IconPencil, IconPlus, IconTarget, IconTriangleAlert, IconDumbbell, IconEdit3, IconAlertCircle } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { HubCard, HubCardHeader, HubPageHeader, HubSection, HubDataGrid, HubDataField, HubQuickActions } from "@/components/hub";
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
import { ClientUpdatesPanel } from "@/components/hub/ClientUpdatesPanel";
import type { SentUpdate } from "@/types";

function GroupTypeLabel({ groupType }: { groupType: DBClientGroupType | null }) {
  if (!groupType) return null;
  return groupType === 'individual_journey' ? 'Individual Journey' : 'Calendar Block';
}

function PaceModeDisplay({ paceMode }: { paceMode: DBClientPaceMode | null }) {
  if (!paceMode) return null;
  const label = paceMode === 'fast' ? 'Fast pace' : paceMode === 'medium' ? 'Medium pace' : 'Slow pace';
  const exerciseCount = paceMode === 'fast' ? '~10 exercises per session' : paceMode === 'medium' ? '~8 exercises per session' : '~5–6 exercises per session';
  return <span>{label} — {exerciseCount}</span>;
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

  const { data: parqs } = await supabase.from("signed_parq").select("*").eq("client_id", client.id).order("created_at", { ascending: false });
  const { data: agreements } = await supabase.from("signed_agreements").select("*").eq("client_id", client.id).order("created_at", { ascending: false });
  const { data: clientDocuments } = await supabase.from("client_documents").select("id, kind, title, status, version, created_at, updated_at, client_name, trainer_name, client_signature, trainer_signature, requires_trainer_signature").eq("client_id", client.id).order("created_at", { ascending: false });

  const latestParq = parqs?.[0] ?? null;
  const latestAgreement = agreements?.[0] ?? null;

  const { data: blocks } = await supabase.from("blocks").select("*").eq("client_id", client.id).order("block_number", { ascending: false });
  const { data: sessions } = await supabase
    .from("sessions")
    .select(`*, blocks!inner(block_number, client_id)`)
    .eq("blocks.client_id", client.id)
    .order("session_number", { ascending: false })
    .limit(50);

  const { data: clientUpdates } = await supabase.from("sent_updates").select("*").eq("client_id", client.id).order("created_at", { ascending: false });
  const { data: ruleTypes } = await supabase.from("training_rule_types").select("id, label, bucket");
  const ruleTypesById = new Map((ruleTypes ?? []).map((rt) => [rt.id, rt]));

  const p = client.profile;
  const initials = client.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const latestBlock = blocks && blocks.length > 0
    ? blocks.find((b) => b.status === "active") ?? blocks.find((b) => b.status === "approved") ?? blocks[0]
    : null;
  const latestSessionLog = sessions?.[0] ? ((sessions[0] as any).data?.session_log ?? null) : null;

  const metaParts: string[] = [];
  metaParts.push(`Client #${client.client_number}`);
  if (p?.logistics?.sessions_per_week) metaParts.push(`${p.logistics.sessions_per_week}x/week`);
  if (p?.logistics?.package) metaParts.push(p.logistics.package);

  const flags = computeComplianceFlags({ client, latestParq: latestParq ?? null, latestAgreement: latestAgreement ?? null });
  const complianceLookup = lookupStatus(flags.effectiveStatus);
  const gpClearance = p?.health?.gp_clearance;
  const manualActions = client.outstanding_actions ?? [];
  const outstandingCount = flags.autoOutstanding.length + manualActions.length;

  /* ── Right rail (Status, Active Block, Quick Actions) ── */
  const rightRail = (
    <div className="space-y-5">
      <HubCard>
        <HubCardHeader icon={<IconClipboardList className="w-4 h-4" />} title="Status" color="slate" noBottomPadding />
        <div className="px-5 pb-5 space-y-0">
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-muted-foreground">Compliance</span>
            {complianceLookup ? <StatusBadge status={flags.effectiveStatus} /> : <span className="text-muted-foreground">—</span>}
          </div>
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-muted-foreground">GP Clearance</span>
            {p?.health ? (
              <Badge variant={gpClearance ? "default" : "destructive"} className="rounded-full">
                {gpClearance ? "Yes" : "No"}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-muted-foreground">Outstanding actions</span>
            <span className="font-medium text-foreground">{outstandingCount}</span>
          </div>
        </div>
      </HubCard>

      <HubCard>
        <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Active Block" noBottomPadding />
        <div className="px-5 pb-5">
          {latestBlock ? (
            <Link href={`/hub/clients/${client.client_number}/blocks/${latestBlock.id}`} className="flex items-center justify-between group py-1">
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
              <Link href={`/hub/clients/${client.client_number}?tab=plan-agent`} className="text-rose font-medium hover:underline">Create Block</Link>
            </div>
          )}
        </div>
      </HubCard>

      <HubCard>
        <HubCardHeader icon={<IconTarget className="w-4 h-4" />} title="Quick Actions" color="amber" noBottomPadding />
        <div className="px-5 pb-5">
          <HubQuickActions actions={[
            { href: `/hub/clients/${client.client_number}/edit`, label: "Edit client", icon: <IconPencil className="w-4 h-4" /> },
            { href: `/hub/clients/${client.client_number}?tab=plan-agent`, label: "Plan a block", icon: <IconPlus className="w-4 h-4" /> },
            { href: `/hub/clients/${client.client_number}/updates`, label: "Updates", icon: <IconMail className="w-4 h-4" /> },
          ]} />
        </div>
      </HubCard>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-start gap-4">
        <Link href="/hub/clients" className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-1">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <HubPageHeader
            title={client.name}
            subtitle={metaParts.join(" · ")}
            actions={
              <div className="flex items-center gap-2">
                <Link href={`/hub/clients/${client.client_number}/edit`}>
                  <Button variant="outline" className="border border-[var(--hub-border)] rounded-lg px-3.5 py-1.5 h-auto text-sm font-medium hover:bg-[var(--hub-hover)] gap-1.5">
                    <IconPencil className="h-4 w-4" /> Edit
                  </Button>
                </Link>
                <Link href={`/hub/clients/${client.client_number}?tab=plan-agent`}>
                  <Button className="bg-rose hover:bg-rose/90 text-white rounded-lg px-3.5 py-1.5 h-auto text-sm font-semibold gap-1.5">
                    <IconPlus className="h-4 w-4" /> Plan Block
                  </Button>
                </Link>
              </div>
            }
          />
          {/* Meta chips */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
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
      </div>

      {/* ── Danger / warning banner ── */}
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

      {/* ── Tabs ── */}
      <ClientDetailTabs>
        <TabsList className="w-full justify-start gap-1 rounded-none border-b border-[var(--hub-border)] bg-transparent p-0 h-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Overview</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Profile</TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Compliance</TabsTrigger>
          <TabsTrigger value="training" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Training</TabsTrigger>
          <TabsTrigger value="plan-agent" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Plan Agent</TabsTrigger>
          <TabsTrigger value="updates" className="rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-rose data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">Updates</TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ── */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <HubCard>
                <HubCardHeader icon={<IconClipboardList className="w-4 h-4" />} title="Snapshot" color="navy" noBottomPadding />
                <div className="px-5 pb-5">
                  <HubDataGrid cols={3}>
                    <HubDataField label="Sessions/week">{p?.logistics?.sessions_per_week ?? "—"}</HubDataField>
                    <HubDataField label="Package">{p?.logistics?.package ?? "—"}</HubDataField>
                    <HubDataField label="Primary Goal"><span className="capitalize">{p?.goals?.primary?.replace("_", " ") ?? "—"}</span></HubDataField>
                  </HubDataGrid>
                </div>
              </HubCard>

              <HubCard>
                <HubCardHeader icon={<IconDumbbell className="w-4 h-4" />} title="Training Snapshot" color="teal" noBottomPadding />
                <div className="px-5 pb-5">
                  {latestSessionLog ? (
                    <HubDataGrid cols={3}>
                      <HubDataField label="Last Session">
                        {new Date(latestSessionLog.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </HubDataField>
                      <HubDataField label="RPE">{latestSessionLog.rpe ?? "—"}</HubDataField>
                      <HubDataField label="Fatigue"><span className="capitalize">{latestSessionLog.fatigue ?? "—"}</span></HubDataField>
                    </HubDataGrid>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg py-2 px-1 text-sm">
                      <span className="text-muted-foreground">No sessions logged yet</span>
                      <Link href={`/hub/clients/${client.client_number}?tab=training`} className="text-rose font-medium hover:underline">View Training</Link>
                    </div>
                  )}
                  {latestBlock && (
                    <div className="mt-3 pt-3 border-t border-[var(--hub-border)]">
                      <HubDataGrid cols={2}>
                        <HubDataField label="Active Block">
                          <Link href={`/hub/clients/${client.client_number}/blocks/${latestBlock.id}`} className="font-semibold text-foreground hover:text-rose transition-colors">
                            Block {latestBlock.block_number}
                          </Link>
                        </HubDataField>
                        <HubDataField label="Status"><StatusBadge status={latestBlock.status} /></HubDataField>
                      </HubDataGrid>
                    </div>
                  )}
                </div>
              </HubCard>

              {p?.programming_adaptations?.some((rule: { severity: string }) => rule.severity === "hard") && (
                <HubCard>
                  <HubCardHeader icon={<IconAlertCircle className="w-4 h-4" />} title="Active Training Rules" color="amber" noBottomPadding />
                  <div className="px-5 pb-5">
                    <ul className="list-none space-y-2">
                      {p!.programming_adaptations
                        .filter((rule: { severity: string }) => rule.severity === "hard")
                        .map((rule: { id: string; rule_type_id: string; detail: string }) => {
                          const ruleType = ruleTypesById.get(rule.rule_type_id);
                          return (
                            <li key={rule.id} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber mt-2 shrink-0" />
                              <span className="text-foreground">
                                {rule.detail}
                                {ruleType && <span className="text-muted-foreground"> — {ruleType.label}</span>}
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </HubCard>
              )}
            </div>
            <div className="lg:col-span-4">{rightRail}</div>
          </div>
        </TabsContent>

        {/* ─ Tab: Profile (decluttered — single full-width card with sections) ── */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <HubCard padded={false}>
                {/* Logistics */}
                {p?.logistics && (
                  <div className="px-5">
                    <HubSection title="Logistics" icon={<IconClipboardList className="w-3.5 h-3.5" />} color="navy">
                      <HubDataGrid cols={3}>
                        <HubDataField label="Location"><span className="capitalize">{p.logistics.training_location?.replace("_", " ") ?? "—"}</span></HubDataField>
                        <HubDataField label="Sessions/week">{p.logistics.sessions_per_week ?? "—"}x</HubDataField>
                        <HubDataField label="Time tier"><span className="capitalize">{p.logistics.time_tier ?? "—"}</span></HubDataField>
                        <HubDataField label="Package">{p.logistics.package ?? "—"}</HubDataField>
                        <HubDataField label="Pace mode"><PaceModeDisplay paceMode={client.pace_mode} /></HubDataField>
                        <HubDataField label="Group type"><GroupTypeLabel groupType={client.group_type} /></HubDataField>
                      </HubDataGrid>
                    </HubSection>
                  </div>
                )}

                {/* Health */}
                {p?.health && (
                  <div className="px-5 border-t border-[var(--hub-border)]">
                    <HubSection title="Health" icon={<IconHeart className="w-3.5 h-3.5" />} color="rose">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">GP Clearance</span>
                          <Badge variant={p.health.gp_clearance ? "default" : "destructive"} className="rounded-full">
                            {p.health.gp_clearance ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <HubDataGrid cols={2}>
                          {p.health.conditions?.length > 0 && (
                            <HubDataField label="Conditions">
                              <div className="flex flex-wrap gap-1.5">{p.health.conditions.map((item, i) => <Badge key={i} variant="secondary" className="rounded-full font-normal text-xs">{item}</Badge>)}</div>
                            </HubDataField>
                          )}
                          {p.health.medications_relevant?.length > 0 && (
                            <HubDataField label="Relevant Medications">
                              <div className="flex flex-wrap gap-1.5">{p.health.medications_relevant.map((item, i) => <Badge key={i} variant="secondary" className="rounded-full font-normal text-xs">{item}</Badge>)}</div>
                            </HubDataField>
                          )}
                          {p.health.pain_points?.length > 0 && (
                            <HubDataField label="Pain Points" span>
                              <div className="flex flex-wrap gap-1.5">{p.health.pain_points.map((item, i) => <Badge key={i} variant="secondary" className="rounded-full font-normal text-xs">{item}</Badge>)}</div>
                            </HubDataField>
                          )}
                          {p.health.contraindications?.length > 0 && (
                            <HubDataField label="Contraindications" span>
                              <div className="flex flex-wrap gap-1.5">{p.health.contraindications.map((item, i) => <Badge key={i} variant="secondary" className="rounded-full font-normal text-xs">{item}</Badge>)}</div>
                            </HubDataField>
                          )}
                        </HubDataGrid>
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
                                        <Badge variant={injury.status === "active" ? "destructive" : injury.status === "monitoring" ? "secondary" : "default"} className="rounded-full capitalize text-xs">
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
                      </div>
                    </HubSection>
                  </div>
                )}

                {/* Physical Baseline */}
                {p?.physical_baseline && (
                  <div className="px-5 border-t border-[var(--hub-border)]">
                    <HubSection title="Physical Baseline" icon={<IconDumbbell className="w-3.5 h-3.5" />} color="teal">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">Fitness Level</span>
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
                        <HubDataGrid cols={3}>
                          <HubDataField label="Lower Body"><span className="capitalize">{p.physical_baseline.strength_baseline?.lower_body ?? "—"}</span></HubDataField>
                          <HubDataField label="Upper Body"><span className="capitalize">{p.physical_baseline.strength_baseline?.upper_body ?? "—"}</span></HubDataField>
                          <HubDataField label="Core"><span className="capitalize">{p.physical_baseline.strength_baseline?.core ?? "—"}</span></HubDataField>
                        </HubDataGrid>
                        {p.physical_baseline.movement_quality_flags?.length > 0 && (
                          <ul className="list-none space-y-1">
                            {p.physical_baseline.movement_quality_flags.map((flag, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <IconTriangleAlert className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                <span>{flag}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </HubSection>
                  </div>
                )}

                {/* Goals */}
                {p?.goals && (
                  <div className="px-5 border-t border-[var(--hub-border)]">
                    <HubSection title="Goals" icon={<IconTarget className="w-3.5 h-3.5" />} color="rose">
                      <HubDataGrid cols={2}>
                        <HubDataField label="Primary"><span className="capitalize">{p.goals.primary?.replace("_", " ") ?? "—"}</span></HubDataField>
                        {p.goals.secondary?.length > 0 && (
                          <HubDataField label="Secondary">
                            <div className="flex flex-wrap gap-1.5">{p.goals.secondary.map((item, i) => <Badge key={i} variant="secondary" className="rounded-full font-normal text-xs">{item}</Badge>)}</div>
                          </HubDataField>
                        )}
                      </HubDataGrid>
                      {p.goals.milestones?.length > 0 && (
                        <div className="mt-3">
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
                    </HubSection>
                  </div>
                )}

                {/* Training Rules */}
                {p?.programming_adaptations && p.programming_adaptations.length > 0 && (
                  <div className="px-5 border-t border-[var(--hub-border)]">
                    <HubSection title="Training Rules" icon={<IconAlertCircle className="w-3.5 h-3.5" />} color="amber" collapsible defaultCollapsed>
                      <ul className="list-none space-y-2">
                        {p.programming_adaptations.map((rule) => {
                          const ruleType = ruleTypesById.get(rule.rule_type_id);
                          return (
                            <li key={rule.id} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber mt-2 shrink-0" />
                              <span className="text-foreground">
                                <span className={rule.severity === "hard" ? "font-semibold" : "text-muted-foreground"}>
                                  {rule.severity === "hard" ? "[HARD]" : "[soft]"}
                                </span>{" "}
                                {rule.detail}
                                {ruleType && <span className="text-muted-foreground"> — {ruleType.label}</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </HubSection>
                  </div>
                )}

                {/* Notes */}
                {(p?.notes?.esther_observations || p?.notes?.motivation_notes || p?.notes?.watch_for) && (
                  <div className="px-5 border-t border-[var(--hub-border)]">
                    <HubSection title="Notes" icon={<IconEdit3 className="w-3.5 h-3.5" />} color="slate">
                      <div className="space-y-3">
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
                      </div>
                    </HubSection>
                  </div>
                )}
              </HubCard>
            </div>
            <div className="lg:col-span-4">{rightRail}</div>
          </div>
        </TabsContent>

        {/* ─ Tab: Compliance ── */}
        <TabsContent value="compliance" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <HubCard>
                <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Compliance & Documents" color="teal" noBottomPadding />
                <div className="px-5 pb-5 space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">Compliance Status</span>
                    {complianceLookup ? <StatusBadge status={flags.effectiveStatus} /> : <span className="font-medium text-foreground">—</span>}
                  </div>

                  <div className="pt-3 border-t border-[var(--hub-border)]">
                    <ClinicalComplianceCard
                      clientId={client.id}
                      initial={{
                        medical_clearance_status: client.medical_clearance_status ?? "not_required",
                        risk_level: client.risk_level ?? "low",
                        exercise_modifications: client.exercise_modifications ?? null,
                      }}
                    />
                  </div>

                  <div className="pt-3 border-t border-[var(--hub-border)]">
                    <DocumentRegister
                      clientNumber={client.client_number}
                      parqs={parqs ?? []}
                      agreements={agreements ?? []}
                      documents={clientDocuments ?? []}
                    />
                  </div>

                  <div className="pt-3 border-t border-[var(--hub-border)]">
                    <span className="text-xs text-muted-foreground block mb-2">GP Clearance Letter</span>
                    <GpLetterCard
                      clientId={client.id}
                      gpLetterStatus={client.gp_letter_status}
                      requestedDate={client.gp_letter_requested_date}
                      receivedDate={client.gp_letter_received_date}
                    />
                  </div>

                  {outstandingCount > 0 && (
                    <div className="pt-3 border-t border-[var(--hub-border)]">
                      <span className="text-xs text-muted-foreground block mb-1">Outstanding</span>
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
                </div>
              </HubCard>

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
            <div className="lg:col-span-4">{rightRail}</div>
          </div>
        </TabsContent>

        {/* ── Tab: Training ── */}
        <TabsContent value="training" className="mt-6">
          <HubCard>
            <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Training Blocks" noBottomPadding />
            <div className="px-5 pb-5">
              {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <Link
                      key={block.id}
                      href={`/hub/clients/${client.client_number}/blocks/${block.id}`}
                      className="flex items-center justify-between rounded-xl border border-[var(--hub-border)] py-3 px-4 transition-all hover:bg-[var(--hub-hover)] hover:border-rose/20 group"
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
                  <Link href={`/hub/clients/${client.client_number}?tab=plan-agent`} className="text-rose font-medium hover:underline">Create Block</Link>
                </div>
              )}
            </div>
          </HubCard>

          <div className="my-4" />

          <HubCard padded={false}>
            <HubCardHeader icon={<IconClipboardList className="w-4 h-4" />} title="Session Log" color="slate" className="px-5 pt-5" />
            {sessions && sessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-canvas)]">
                      <th className="text-left font-medium text-muted-foreground text-xs px-5 py-2.5">Block</th>
                      <th className="text-left font-medium text-muted-foreground text-xs px-5 py-2.5">Session #</th>
                      <th className="text-left font-medium text-muted-foreground text-xs px-5 py-2.5">Date</th>
                      <th className="text-left font-medium text-muted-foreground text-xs px-5 py-2.5">RPE</th>
                      <th className="text-left font-medium text-muted-foreground text-xs px-5 py-2.5">Fatigue</th>
                      <th className="text-left font-medium text-muted-foreground text-xs px-5 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => {
                      const log = (session.data as any)?.session_log;
                      return (
                        <tr key={session.id} className="border-b border-[var(--hub-border)] last:border-0">
                          <td className="py-2.5 px-5 text-foreground">{(session?.blocks as any)?.block_number || '-'}</td>
                          <td className="py-2.5 px-5 text-foreground">{session.session_number}</td>
                          <td className="py-2.5 px-5 text-muted-foreground">
                            {log?.completed_at
                              ? new Date(log.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                              : "—"}
                          </td>
                          <td className="py-2.5 px-5 text-muted-foreground">{log?.rpe ?? "—"}</td>
                          <td className="py-2.5 px-5 text-muted-foreground capitalize">{log?.fatigue ?? "—"}</td>
                          <td className="py-2.5 px-5 text-muted-foreground max-w-[240px] truncate">{log?.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 pb-5">
                <EmptyState title="No sessions logged yet." />
              </div>
            )}
          </HubCard>
        </TabsContent>

        {/* ── Tab: Plan Agent ── */}
        <TabsContent value="plan-agent" className="mt-6">
          <PlanAgentTab
            clientNumber={client.client_number}
            clientName={client.name}
            paceMode={client.pace_mode ?? "medium"}
          />
        </TabsContent>

        {/* ── Tab: Updates ── */}
        <TabsContent value="updates" className="mt-6">
          <HubCard>
            <HubCardHeader
              icon={<IconMail className="w-4 h-4" />}
              title="6-Week Updates"
              color="teal"
              action={
                <Link href={`/hub/clients/${client.client_number}/updates`} className="text-xs font-medium text-teal hover:underline">
                  Full history &amp; report
                </Link>
              }
              noBottomPadding
            />
            <div className="px-5 pb-5">
              <ClientUpdatesPanel
                clientNumber={client.client_number}
                updates={(clientUpdates || []) as SentUpdate[]}
              />
            </div>
          </HubCard>
        </TabsContent>
      </ClientDetailTabs>
    </div>
  );
}
