"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { IconPlus } from "@/components/icons";
import { toast } from "sonner";
import type { StudioEquipment } from "@/types";

interface EquipmentManagerProps {
  initialEquipment: StudioEquipment[];
}

export function EquipmentManager({ initialEquipment }: EquipmentManagerProps) {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [homeEquivalent, setHomeEquivalent] = useState("");

  async function addEquipment() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          detail: detail.trim() || null,
          home_equivalent: homeEquivalent.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to add equipment");
      const created = await res.json();
      setEquipment((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      setName("");
      setDetail("");
      setHomeEquivalent("");
      setAdding(false);
      toast.success("Equipment added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add equipment");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: StudioEquipment) {
    const next = !item.active;
    setEquipment((prev) => prev.map((e) => (e.id === item.id ? { ...e, active: next } : e)));
    const res = await fetch(`/api/equipment/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    if (!res.ok) {
      setEquipment((prev) => prev.map((e) => (e.id === item.id ? { ...e, active: !next } : e)));
      toast.error("Failed to update equipment");
    }
  }

  return (
    <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Equipment</CardTitle>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setAdding((v) => !v)}>
          <IconPlus className="h-4 w-4" />
          Add equipment
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <div className="space-y-3 rounded-xl border border-[var(--hub-border)] p-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adjustable cable machine" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Detail</Label>
                <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. 2kg – 40kg" />
              </div>
              <div className="space-y-2">
                <Label>Home Equivalent</Label>
                <Input value={homeEquivalent} onChange={(e) => setHomeEquivalent(e.target.value)} placeholder="e.g. Resistance band" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              <Button onClick={addEquipment} disabled={saving || !name.trim()}>Save</Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Home Equivalent</TableHead>
              <TableHead className="text-right">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md">{item.detail ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md">{item.home_equivalent ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Switch checked={item.active} onCheckedChange={() => toggleActive(item)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
