"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { IconPlus } from "@/components/icons";
import { toast } from "sonner";
import type { TrainingRuleBucket, TrainingRuleType } from "@/types";

const BUCKET_LABELS: Record<TrainingRuleBucket, string> = {
  exclusion: "Exclusion",
  restriction: "Restriction",
  emphasis: "Emphasis",
  structural: "Structural",
  coaching_style: "Coaching style",
  general: "General",
};

const BUCKET_OPTIONS = Object.keys(BUCKET_LABELS) as TrainingRuleBucket[];

interface TrainingRuleTypesManagerProps {
  initialRuleTypes: TrainingRuleType[];
}

export function TrainingRuleTypesManager({ initialRuleTypes }: TrainingRuleTypesManagerProps) {
  const [ruleTypes, setRuleTypes] = useState(initialRuleTypes);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [bucket, setBucket] = useState<TrainingRuleBucket>("exclusion");
  const [description, setDescription] = useState("");

  async function addRuleType() {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/rule-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), bucket, description: description.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to add rule type");
      const created = await res.json();
      setRuleTypes((prev) => [...prev, created].sort((a, b) => a.bucket.localeCompare(b.bucket) || a.label.localeCompare(b.label)));
      setLabel("");
      setDescription("");
      setAdding(false);
      toast.success("Rule type added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add rule type");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(ruleType: TrainingRuleType) {
    const next = !ruleType.active;
    setRuleTypes((prev) => prev.map((rt) => (rt.id === ruleType.id ? { ...rt, active: next } : rt)));
    const res = await fetch(`/api/rule-types/${ruleType.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    if (!res.ok) {
      setRuleTypes((prev) => prev.map((rt) => (rt.id === ruleType.id ? { ...rt, active: !next } : rt)));
      toast.error("Failed to update rule type");
    }
  }

  return (
    <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Rule types</CardTitle>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setAdding((v) => !v)}>
          <IconPlus className="h-4 w-4" />
          Add rule type
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <div className="space-y-3 rounded-xl border border-[var(--hub-border)] p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Breathing cue requirement" />
              </div>
              <div className="space-y-2">
                <Label>Bucket</Label>
                <Select value={bucket} onValueChange={(v: TrainingRuleBucket) => setBucket(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUCKET_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>{BUCKET_LABELS[b]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (shown to trainers when picking this type)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              <Button onClick={addRuleType} disabled={saving || !label.trim()}>Save</Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Bucket</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ruleTypes.map((rt) => (
              <TableRow key={rt.id}>
                <TableCell className="font-medium">{rt.label}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">{BUCKET_LABELS[rt.bucket]}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md">{rt.description ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Switch checked={rt.active} onCheckedChange={() => toggleActive(rt)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
