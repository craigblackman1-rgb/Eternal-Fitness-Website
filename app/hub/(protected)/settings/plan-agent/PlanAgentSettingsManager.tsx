"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface PlanAgentSetting {
  key: string;
  label: string;
  section: string;
  value_type: string;
  value: unknown;
  sort_order: number;
}

interface PlanAgentSettingsManagerProps {
  initialSettings: PlanAgentSetting[];
}

interface PaceMode {
  label: string;
  superset_a: number;
  superset_b: number;
  arms_core: number;
  finisher: boolean;
  total: number;
}

interface PaceModesValue {
  fast: PaceMode;
  medium: PaceMode;
  slow: PaceMode;
}

export function PlanAgentSettingsManager({ initialSettings }: PlanAgentSettingsManagerProps) {
  const [settings, setSettings] = useState(initialSettings);

  const grouped = settings.reduce<Record<string, PlanAgentSetting[]>>((acc, s) => {
    if (!acc[s.section]) acc[s.section] = [];
    acc[s.section].push(s);
    return acc;
  }, {});

  const sortedSections = Object.keys(grouped).sort((a, b) => {
    const orderA = grouped[a][0]?.sort_order ?? 0;
    const orderB = grouped[b][0]?.sort_order ?? 0;
    return orderA - orderB;
  });

  function updateLocal(key: string, value: unknown) {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  }

  async function saveSetting(key: string, value: unknown) {
    try {
      const res = await fetch(`/api/plan-agent-settings/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <div className="space-y-8">
      {sortedSections.map((section) => (
        <div key={section}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {section}
          </h2>
          <div className="space-y-4">
            {grouped[section].map((setting) => (
              <SettingEditor
                key={setting.key}
                setting={setting}
                onUpdate={(value) => updateLocal(setting.key, value)}
                onSave={(value) => saveSetting(setting.key, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingEditor({
  setting,
  onUpdate,
  onSave,
}: {
  setting: PlanAgentSetting;
  onUpdate: (value: unknown) => void;
  onSave: (value: unknown) => void;
}) {
  if (setting.value_type === "pace_modes") {
    return <PaceModesEditor setting={setting} onUpdate={onUpdate} onSave={onSave} />;
  }
  if (setting.value_type === "text") {
    return <TextEditor setting={setting} onUpdate={onUpdate} onSave={onSave} />;
  }
  if (setting.value_type === "list") {
    return <ListEditor setting={setting} onUpdate={onUpdate} onSave={onSave} />;
  }
  return null;
}

function PaceModesEditor({
  setting,
  onUpdate,
  onSave,
}: {
  setting: PlanAgentSetting;
  onUpdate: (value: unknown) => void;
  onSave: (value: unknown) => void;
}) {
  const modes = setting.value as PaceModesValue;
  const [draft, setDraft] = useState(modes);
  const [saving, setSaving] = useState(false);

  function updateField(key: keyof PaceMode, mode: string, val: string | boolean) {
    setDraft((prev) => {
      const next = { ...prev, [mode]: { ...prev[mode], [key]: typeof val === "boolean" ? val : (key === "finisher" ? Boolean(val) : Number(val)) } };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    onUpdate(draft);
    await onSave(draft);
    setSaving(false);
  }

  const modeKeys = ["fast", "medium", "slow"] as const;

  return (
    <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
      <CardHeader>
        <CardTitle className="text-base">{setting.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--hub-border)]">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Mode</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Superset A</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Superset B</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Arms + Core</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Total</th>
                <th className="text-center py-2 pl-3 font-medium text-muted-foreground">Finisher</th>
              </tr>
            </thead>
            <tbody>
              {modeKeys.map((mode) => (
                <tr key={mode} className="border-b border-[var(--hub-border)]/50">
                  <td className="py-2 pr-4 font-medium capitalize">{draft[mode].label}</td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={draft[mode].superset_a}
                      onChange={(e) => updateField("superset_a", mode, e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={draft[mode].superset_b}
                      onChange={(e) => updateField("superset_b", mode, e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={draft[mode].arms_core}
                      onChange={(e) => updateField("arms_core", mode, e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={draft[mode].total}
                      onChange={(e) => updateField("total", mode, e.target.value)}
                    />
                  </td>
                  <td className="py-2 pl-3 flex justify-center">
                    <Switch
                      checked={draft[mode].finisher}
                      onCheckedChange={(checked) => updateField("finisher", mode, checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TextEditor({
  setting,
  onUpdate,
  onSave,
}: {
  setting: PlanAgentSetting;
  onUpdate: (value: unknown) => void;
  onSave: (value: unknown) => void;
}) {
  const [draft, setDraft] = useState(typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    onUpdate(draft);
    await onSave(draft);
    setSaving(false);
  }

  return (
    <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
      <CardHeader>
        <CardTitle className="text-base">{setting.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={10}
          className="font-mono text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ListEditor({
  setting,
  onUpdate,
  onSave,
}: {
  setting: PlanAgentSetting;
  onUpdate: (value: unknown) => void;
  onSave: (value: unknown) => void;
}) {
  const arr = Array.isArray(setting.value) ? setting.value : [];
  const [draft, setDraft] = useState(arr.join("\n"));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = draft.split("\n").map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    onUpdate(parsed);
    await onSave(parsed);
    setSaving(false);
  }

  return (
    <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
      <CardHeader>
        <CardTitle className="text-base">{setting.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="text-xs text-muted-foreground">One item per line</Label>
        <Textarea
          rows={10}
          className="font-mono text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
