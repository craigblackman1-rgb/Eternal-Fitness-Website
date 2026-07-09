"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { IconChevronLeft } from "@/components/icons";
import Link from "next/link";
import { TagMultiSelect } from "@/components/hub/TagMultiSelect";
import { InjuryHistoryTable } from "@/components/hub/InjuryHistoryTable";
import type { ClientProfile, DBClientComplianceStatus, DBClientGroupType, DBClientPaceMode, Gender } from "@/types";

function calculateAge(dob: string | null): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const emptyProfile: ClientProfile = {
  client: { id: "", name: "", age: 0, date_of_birth: null, gender: "" },
  logistics: { training_location: "studio", sessions_per_week: 2, time_tier: "standard", package: "12-week", block_number: 1 },
  health: { gp_clearance: false, conditions: [], contraindications: [], medications_relevant: [], injury_history: [], pain_points: [], parq_trainer_override: false, parq_trainer_override_note: "" },
  physical_baseline: { fitness_level: 3, movement_quality_flags: [], strength_baseline: { lower_body: "beginner", upper_body: "beginner", core: "beginner" } },
  programming_adaptations: [],
  goals: { primary: "general_fitness", secondary: [], milestones: [] },
  notes: { esther_observations: "", motivation_notes: "", watch_for: "" },
};

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState<ClientProfile>(emptyProfile);
  const [complianceStatus, setComplianceStatus] = useState<DBClientComplianceStatus>("action_needed");
  const [outstandingActions, setOutstandingActions] = useState("");
  const [groupType, setGroupType] = useState<DBClientGroupType>("individual_journey");
  const [paceMode, setPaceMode] = useState<DBClientPaceMode>("medium");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("client_number", parseInt(params.id))
        .single();
      if (error || !data) {
        toast.error("Failed to load client");
        router.push("/hub/clients");
        return;
      }
      setName(data.name);
      setEmail(data.email ?? "");
      setPhone(data.phone ?? "");
      const p = data.profile || {};
      setProfile({
        client: { ...emptyProfile.client, ...(p.client || {}) },
        logistics: { ...emptyProfile.logistics, ...(p.logistics || {}) },
        health: { ...emptyProfile.health, ...(p.health || {}) },
        physical_baseline: {
          ...emptyProfile.physical_baseline,
          ...(p.physical_baseline || {}),
          strength_baseline: {
            ...emptyProfile.physical_baseline.strength_baseline,
            ...(p.physical_baseline?.strength_baseline || {}),
          },
        },
        programming_adaptations: p.programming_adaptations || [],
        goals: { ...emptyProfile.goals, ...(p.goals || {}) },
        notes: { ...emptyProfile.notes, ...(p.notes || {}) },
      });
      setComplianceStatus(data.compliance_status ?? "action_needed");
      setOutstandingActions((data.outstanding_actions ?? []).join("\n"));
      setGroupType(data.group_type ?? "individual_journey");
      setPaceMode(data.pace_mode ?? "medium");
      setLoading(false);
    }
    load();
  }, [params.id, supabase, router]);

  const updateProfile = <K extends keyof ClientProfile>(section: K, updates: Partial<ClientProfile[K]>) => {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Client name is required");
      return;
    }

    setSaving(true);
    const fullProfile: ClientProfile = {
      ...profile,
      client: { ...profile.client, name: name.trim(), age: calculateAge(profile.client.date_of_birth) || profile.client.age },
    };

    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        profile: fullProfile,
        compliance_status: complianceStatus,
        outstanding_actions: outstandingActions.split("\n").map((s) => s.trim()).filter(Boolean),
        group_type: groupType,
        pace_mode: paceMode,
      })
      .eq("client_number", parseInt(params.id));

    if (error) {
      toast.error(`Failed to save: ${error.message}`);
      setSaving(false);
      return;
    }

    toast.success("Client updated");
    router.push(`/hub/clients/${params.id}`);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${params.id}`} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit Client</h1>
          <p className="text-muted-foreground">{name}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profile.client.date_of_birth ?? ""}
                  onChange={(e) => updateProfile("client", { date_of_birth: e.target.value || null })}
                />
                <p className="text-xs text-muted-foreground">
                  {profile.client.date_of_birth ? `Age: ${calculateAge(profile.client.date_of_birth)}` : "Age will be calculated from date of birth"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={profile.client.gender || undefined} onValueChange={(v: Gender) => updateProfile("client", { gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                />
                <p className="text-xs text-muted-foreground">Used to send 6-week updates.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07…"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Logistics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Training Location</Label>
              <Select value={profile.logistics.training_location} onValueChange={(v: "studio" | "home" | "both") => updateProfile("logistics", { training_location: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sessions / Week</Label>
              <Select value={String(profile.logistics.sessions_per_week)} onValueChange={(v) => updateProfile("logistics", { sessions_per_week: parseInt(v) as 1 | 2 | 3 })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="3">3x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Tier</Label>
              <Select value={profile.logistics.time_tier} onValueChange={(v: "compact" | "standard" | "extended") => updateProfile("logistics", { time_tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact (~45m)</SelectItem>
                  <SelectItem value="standard">Standard (~60m)</SelectItem>
                  <SelectItem value="extended">Extended (~75-90m)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Package</Label>
              <Select value={profile.logistics.package} onValueChange={(v: "12-week" | "24-week" | "ongoing") => updateProfile("logistics", { package: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12-week">12-week</SelectItem>
                  <SelectItem value="24-week">24-week</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Health & Clearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="gp_clearance"
                checked={profile.health.gp_clearance}
                onChange={(e) => updateProfile("health", { gp_clearance: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 accent-rose"
              />
              <Label htmlFor="gp_clearance">GP clearance obtained</Label>
            </div>
            <div className="space-y-2 rounded-xl border border-[var(--hub-border)] p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="parq_trainer_override"
                  checked={profile.health.parq_trainer_override ?? false}
                  onChange={(e) => updateProfile("health", { parq_trainer_override: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 accent-rose"
                />
                <Label htmlFor="parq_trainer_override">PAR-Q trainer override — completed on Microsoft Forms, not yet in system</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Only tick this once you've personally reviewed the client's submitted PAR-Q. This unblocks plan
                generation until the record is migrated into the hub — it does not replace a signed PAR-Q on file.
              </p>
              {profile.health.parq_trainer_override && (
                <Textarea
                  placeholder="Optional note — anything flagged on the form Esther should know (e.g. risk factors, restrictions)"
                  value={profile.health.parq_trainer_override_note ?? ""}
                  onChange={(e) => updateProfile("health", { parq_trainer_override_note: e.target.value })}
                  rows={2}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Conditions</Label>
              <TagMultiSelect
                category="condition"
                selected={profile.health.conditions}
                onChange={(conditions) => updateProfile("health", { conditions })}
                placeholder="Select known conditions or add new..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Contraindications</Label>
                <TagMultiSelect
                  category="contraindication"
                  selected={profile.health.contraindications}
                  onChange={(contraindications) => updateProfile("health", { contraindications })}
                  placeholder="Select contraindications or add new..."
                />
              </div>
              <div className="space-y-2">
                <Label>Pain Points</Label>
                <TagMultiSelect
                  category="pain_point"
                  selected={profile.health.pain_points}
                  onChange={(pain_points) => updateProfile("health", { pain_points })}
                  placeholder="Select pain points or add new..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Injury History</Label>
              <InjuryHistoryTable
                value={profile.health.injury_history}
                onChange={(injury_history) => updateProfile("health", { injury_history })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Physical Baseline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fitness Level (1 = very low, 5 = high)</Label>
              <Select
                value={String(profile.physical_baseline.fitness_level)}
                onValueChange={(v) => updateProfile("physical_baseline", { fitness_level: parseInt(v) as 1 | 2 | 3 | 4 | 5 })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Very Low</SelectItem>
                  <SelectItem value="2">2 — Low</SelectItem>
                  <SelectItem value="3">3 — Moderate</SelectItem>
                  <SelectItem value="4">4 — Good</SelectItem>
                  <SelectItem value="5">5 — High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Lower Body Strength</Label>
                <Select
                  value={profile.physical_baseline.strength_baseline.lower_body}
                  onValueChange={(v: "beginner" | "intermediate" | "advanced") =>
                    setProfile((prev) => ({ ...prev, physical_baseline: { ...prev.physical_baseline, strength_baseline: { ...prev.physical_baseline.strength_baseline, lower_body: v } } }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Upper Body Strength</Label>
                <Select
                  value={profile.physical_baseline.strength_baseline.upper_body}
                  onValueChange={(v: "beginner" | "intermediate" | "advanced") =>
                    setProfile((prev) => ({ ...prev, physical_baseline: { ...prev.physical_baseline, strength_baseline: { ...prev.physical_baseline.strength_baseline, upper_body: v } } }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Core Strength</Label>
                <Select
                  value={profile.physical_baseline.strength_baseline.core}
                  onValueChange={(v: "beginner" | "intermediate" | "advanced") =>
                    setProfile((prev) => ({ ...prev, physical_baseline: { ...prev.physical_baseline, strength_baseline: { ...prev.physical_baseline.strength_baseline, core: v } } }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Movement Quality Flags</Label>
              <TagMultiSelect
                category="movement_quality_flag"
                selected={profile.physical_baseline.movement_quality_flags}
                onChange={(movement_quality_flags) => updateProfile("physical_baseline", { movement_quality_flags })}
                placeholder="Select observed movement quality flags or add new..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Compliance &amp; Pace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Compliance Override</Label>
                <Select value={complianceStatus} onValueChange={(v: DBClientComplianceStatus) => setComplianceStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">No override — status computed automatically</SelectItem>
                    <SelectItem value="do_not_train">Do Not Train (hard stop)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Action Needed / Pending Medical are now worked out automatically from PAR-Q, agreement,
                  and GP clearance status — see the Compliance & Documents card on the profile.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Pace Mode</Label>
                <Select value={paceMode} onValueChange={(v: DBClientPaceMode) => setPaceMode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (~10 exercises/session)</SelectItem>
                    <SelectItem value="medium">Medium (~8 exercises/session)</SelectItem>
                    <SelectItem value="slow">Slow (~5–6 exercises/session)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Group Type</Label>
                <Select value={groupType} onValueChange={(v: DBClientGroupType) => setGroupType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual_journey">Individual Journey</SelectItem>
                    <SelectItem value="calendar_block">Calendar Block (shared)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Outstanding Actions (one per line)</Label>
              <Textarea
                value={outstandingActions}
                onChange={(e) => setOutstandingActions(e.target.value)}
                rows={4}
                placeholder="e.g. No signed PAR-Q on file&#10;GP clearance letter outstanding"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Goal</Label>
              <Select value={profile.goals.primary} onValueChange={(v: ClientProfile["goals"]["primary"]) => updateProfile("goals", { primary: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="mobility">Mobility</SelectItem>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="general_fitness">General Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Milestones</Label>
              <TagMultiSelect
                category="milestone"
                selected={profile.goals.milestones}
                onChange={(milestones) => updateProfile("goals", { milestones })}
                placeholder="Select milestones or add new..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Programming Adaptations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Adaptations</Label>
              <TagMultiSelect
                category="adaptation"
                selected={profile.programming_adaptations}
                onChange={(programming_adaptations) => setProfile((prev) => ({ ...prev, programming_adaptations }))}
                placeholder="Select adaptations or add new..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Esther's Observations</Label>
              <Textarea value={profile.notes.esther_observations} onChange={(e) => updateProfile("notes", { esther_observations: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Motivation Notes</Label>
                <Textarea value={profile.notes.motivation_notes} onChange={(e) => updateProfile("notes", { motivation_notes: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Watch For</Label>
                <Textarea value={profile.notes.watch_for} onChange={(e) => updateProfile("notes", { watch_for: e.target.value })} rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/hub/clients/${params.id}`}>
            <Button variant="outline" className="rounded-full border-border/60">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="rounded-full gap-2 bg-rose hover:bg-rose/90 text-white">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
