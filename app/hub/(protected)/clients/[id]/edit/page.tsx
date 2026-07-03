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
import type { ClientProfile, DBClientComplianceStatus, DBClientGroupType, DBClientPaceMode } from "@/types";

const emptyProfile: ClientProfile = {
  client: { id: "", name: "", age: 0, gender: "" },
  logistics: { training_location: "studio", sessions_per_week: 2, time_tier: "standard", package: "12-week", block_number: 1 },
  health: { gp_clearance: false, conditions: [], contraindications: [], medications_relevant: [], injury_history: [], pain_points: [] },
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

  const arrayToString = (items: string[]) => items.join(", ");
  const stringToArray = (val: string) => val.split(",").map((s) => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Client name is required");
      return;
    }

    setSaving(true);
    const fullProfile: ClientProfile = {
      ...profile,
      client: { ...profile.client, name: name.trim() },
    };

    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
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
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" value={profile.client.age || ""} onChange={(e) => updateProfile("client", { age: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input id="gender" value={profile.client.gender} onChange={(e) => updateProfile("client", { gender: e.target.value })} />
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Conditions (comma-separated)</Label>
                <Input value={arrayToString(profile.health.conditions)} onChange={(e) => updateProfile("health", { conditions: stringToArray(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Contraindications</Label>
                <Input value={arrayToString(profile.health.contraindications)} onChange={(e) => updateProfile("health", { contraindications: stringToArray(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Injury History</Label>
                <Input value={arrayToString(profile.health.injury_history)} onChange={(e) => updateProfile("health", { injury_history: stringToArray(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Pain Points</Label>
                <Input value={arrayToString(profile.health.pain_points)} onChange={(e) => updateProfile("health", { pain_points: stringToArray(e.target.value) })} />
              </div>
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
              <Label>Movement Quality Flags (one per line)</Label>
              <Textarea
                value={profile.physical_baseline.movement_quality_flags.join("\n")}
                onChange={(e) =>
                  updateProfile("physical_baseline", {
                    movement_quality_flags: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  })
                }
                rows={3}
                placeholder="e.g. Limited hip flexion&#10;Knee valgus under load"
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
                <Label>Compliance Status</Label>
                <Select value={complianceStatus} onValueChange={(v: DBClientComplianceStatus) => setComplianceStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear — all paperwork in order</SelectItem>
                    <SelectItem value="action_needed">Action Needed</SelectItem>
                    <SelectItem value="pending_medical">Pending Medical Clearance</SelectItem>
                    <SelectItem value="do_not_train">Do Not Train</SelectItem>
                  </SelectContent>
                </Select>
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
              <Input value={arrayToString(profile.goals.milestones)} onChange={(e) => updateProfile("goals", { milestones: stringToArray(e.target.value) })} placeholder="Comma-separated milestones" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader>
            <CardTitle>Programming Adaptations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Adaptations (one per line)</Label>
              <Textarea
                value={profile.programming_adaptations.join("\n")}
                onChange={(e) => setProfile({ ...profile, programming_adaptations: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                rows={6}
                placeholder="Enter each adaptation on a new line"
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
