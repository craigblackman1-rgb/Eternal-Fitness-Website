"use client";

import { useState } from "react";
import { HubCard, HubCardHeader, EmptyState } from "@/components/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  IconPlus,
  IconClipboardList,
  IconFileText,
  IconSparkles,
  IconTrash2,
  IconPencil,
} from "@/components/icons";
import { toast } from "sonner";
import type {
  ProcessEntry,
  ProcessStatus,
  Sop,
  ImprovementEntry,
} from "@/types";

type TabId = "register" | "sops" | "log";

const TABS: { id: TabId; label: string }[] = [
  { id: "register", label: "Process Register" },
  { id: "sops", label: "SOPs" },
  { id: "log", label: "Improvement Log" },
];

const STATUS_OPTIONS: ProcessStatus[] = ["active", "draft", "review", "archived"];

interface ProcessQualityManagerProps {
  initialProcessEntries: ProcessEntry[];
  initialSops: Sop[];
  initialImprovementLog: ImprovementEntry[];
}

export function ProcessQualityManager({
  initialProcessEntries,
  initialSops,
  initialImprovementLog,
}: ProcessQualityManagerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("register");

  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--hub-border)] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-rose text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "register" && (
        <RegisterSection initial={initialProcessEntries} />
      )}
      {activeTab === "sops" && <SopsSection initial={initialSops} />}
      {activeTab === "log" && <LogSection initial={initialImprovementLog} />}
    </div>
  );
}

// ─── Process Register ────────────────────────────────────────────────────────

function RegisterSection({ initial }: { initial: ProcessEntry[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<ProcessEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const blank: Omit<ProcessEntry, "id" | "created_at"> = {
    ref: "",
    name: "",
    owner: "Esther Fair",
    area: "General",
    status: "draft",
    reviewed: null,
    category: "General",
    sop_ref: null,
  };
  const [form, setForm] = useState(blank);

  function startAdd() {
    setEditing(null);
    setForm(blank);
    setShowForm(true);
  }
  function startEdit(item: ProcessEntry) {
    setEditing(item);
    setForm({
      ref: item.ref,
      name: item.name,
      owner: item.owner,
      area: item.area,
      status: item.status,
      reviewed: item.reviewed,
      category: item.category,
      sop_ref: item.sop_ref,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.ref.trim() || !form.name.trim()) {
      toast.error("Ref and name are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/process-entries/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update");
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
        toast.success("Process updated");
      } else {
        const res = await fetch("/api/process-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to add");
        const created = await res.json();
        setItems((prev) => [...prev, created].sort((a, b) => a.ref.localeCompare(b.ref)));
        toast.success("Process added");
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: ProcessEntry) {
    if (!confirm(`Delete process ${item.ref} — ${item.name}?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const res = await fetch(`/api/process-entries/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(initial);
      toast.error("Failed to delete");
    } else {
      toast.success("Process deleted");
    }
  }

  return (
    <HubCard padded={false}>
      <div className="p-5">
        <HubCardHeader
          icon={<IconClipboardList className="w-4 h-4" />}
          title="Process Register"
          subtitle="Every core process, owned and dated. Plain English, one page per process."
          color="rose"
          action={
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={startAdd}>
              <IconPlus className="h-4 w-4" /> Add process
            </Button>
          }
          noBottomPadding
        />
      </div>

      <div className="px-5 pb-5">
        {showForm && (
          <div className="mb-5 space-y-3 rounded-xl border border-[var(--hub-border)] p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Ref</Label>
                <Input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="PR-001" />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client onboarding" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Admin" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="General" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ProcessStatus })}
                  className="w-full rounded-md border border-[var(--hub-border)] bg-background px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reviewed</Label>
                <Input value={form.reviewed ?? ""} onChange={(e) => setForm({ ...form, reviewed: e.target.value || null })} placeholder="Jul 2026" />
              </div>
              <div className="space-y-2">
                <Label>Linked SOP ref</Label>
                <Input value={form.sop_ref ?? ""} onChange={(e) => setForm({ ...form, sop_ref: e.target.value || null })} placeholder="SOP-001 (optional)" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{editing ? "Save changes" : "Add process"}</Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={<IconClipboardList className="w-7 h-7" />}
            title="No processes yet"
            description="Add Eternal Fitness's own processes here — client onboarding, plan building, PAR-Q handling, update-email sending."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--hub-border)] text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Ref</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Reviewed</th>
                  <th className="py-2 pr-4 font-medium">SOP</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--hub-border)] last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-rose">{item.ref}</td>
                    <td className="py-2.5 pr-4 font-medium">{item.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{item.category}</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-full bg-rose/10 px-2 py-0.5 text-xs font-medium text-rose">{item.status}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{item.reviewed ?? "—"}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{item.sop_ref ?? "—"}</td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(item)}><IconPencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(item)}><IconTrash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </HubCard>
  );
}

// ─── SOPs ────────────────────────────────────────────────────────────────────

function SopsSection({ initial }: { initial: Sop[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Sop | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const blank: Omit<Sop, "id" | "created_at"> = {
    ref: "",
    title: "",
    area: "General",
    trigger: "",
    owner: "Esther Fair",
    last_updated: null,
    what: "",
    good_looks_like: "",
    steps: [],
    prompt_template: null,
  };
  const [form, setForm] = useState(blank);

  function startAdd() {
    setEditing(null);
    setForm(blank);
    setShowForm(true);
  }
  function startEdit(item: Sop) {
    setEditing(item);
    setForm({
      ref: item.ref,
      title: item.title,
      area: item.area,
      trigger: item.trigger,
      owner: item.owner,
      last_updated: item.last_updated,
      what: item.what,
      good_looks_like: item.good_looks_like,
      steps: item.steps,
      prompt_template: item.prompt_template,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.ref.trim() || !form.title.trim() || !form.trigger.trim() || !form.what.trim() || !form.good_looks_like.trim()) {
      toast.error("Ref, title, trigger, what and what-good-looks-like are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/sops/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update");
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
        toast.success("SOP updated");
      } else {
        const res = await fetch("/api/sops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to add");
        const created = await res.json();
        setItems((prev) => [...prev, created].sort((a, b) => a.ref.localeCompare(b.ref)));
        toast.success("SOP added");
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Sop) {
    if (!confirm(`Delete SOP ${item.ref} — ${item.title}?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const res = await fetch(`/api/sops/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(initial);
      toast.error("Failed to delete");
    } else {
      toast.success("SOP deleted");
    }
  }

  return (
    <HubCard padded={false}>
      <div className="p-5">
        <HubCardHeader
          icon={<IconFileText className="w-4 h-4" />}
          title="Standard Operating Procedures"
          subtitle="What it does · Trigger · Steps · Owner · What good looks like — one page per process."
          color="teal"
          action={
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={startAdd}>
              <IconPlus className="h-4 w-4" /> Add SOP
            </Button>
          }
          noBottomPadding
        />
      </div>

      <div className="px-5 pb-5">
        {showForm && (
          <div className="mb-5 space-y-3 rounded-xl border border-[var(--hub-border)] p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Ref</Label>
                <Input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="SOP-001" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Client onboarding" />
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="General" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last updated</Label>
                <Input value={form.last_updated ?? ""} onChange={(e) => setForm({ ...form, last_updated: e.target.value || null })} placeholder="Jul 2026" />
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} placeholder="What starts this process" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>What this process does</Label>
              <Textarea value={form.what} onChange={(e) => setForm({ ...form, what: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Steps (one per line)</Label>
              <Textarea
                value={form.steps.join("\n")}
                onChange={(e) => setForm({ ...form, steps: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                rows={5}
                placeholder={"1. Step one\n2. Step two"}
              />
            </div>
            <div className="space-y-2">
              <Label>What good looks like</Label>
              <Textarea value={form.good_looks_like} onChange={(e) => setForm({ ...form, good_looks_like: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Prompt template (optional)</Label>
              <Textarea value={form.prompt_template ?? ""} onChange={(e) => setForm({ ...form, prompt_template: e.target.value || null })} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{editing ? "Save changes" : "Add SOP"}</Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={<IconFileText className="w-7 h-7" />}
            title="No SOPs yet"
            description="Write the three required SOPs: migrate a client, onboard a new client, build a plan in the hub."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--hub-border)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-teal">{item.ref}</span>
                    <p className="font-semibold text-foreground truncate">{item.title}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(item)}><IconPencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(item)}><IconTrash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.what}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.steps.length} steps · Trigger: {item.trigger.length > 60 ? item.trigger.slice(0, 60) + "…" : item.trigger}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </HubCard>
  );
}

// ─── Improvement Log ─────────────────────────────────────────────────────────

function LogSection({ initial }: { initial: ImprovementEntry[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<ImprovementEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const blank: Omit<ImprovementEntry, "id" | "created_at"> = {
    ref: "",
    title: "",
    entry_date: null,
    process_ref: null,
    broke: "",
    changed: "",
    result: "",
  };
  const [form, setForm] = useState(blank);

  function startAdd() {
    setEditing(null);
    setForm(blank);
    setShowForm(true);
  }
  function startEdit(item: ImprovementEntry) {
    setEditing(item);
    setForm({
      ref: item.ref,
      title: item.title,
      entry_date: item.entry_date,
      process_ref: item.process_ref,
      broke: item.broke,
      changed: item.changed,
      result: item.result,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.ref.trim() || !form.title.trim() || !form.broke.trim() || !form.changed.trim() || !form.result.trim()) {
      toast.error("Ref, title, broke, changed and result are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/improvement-log/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update");
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
        toast.success("Entry updated");
      } else {
        const res = await fetch("/api/improvement-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to add");
        const created = await res.json();
        setItems((prev) => [...prev, created].sort((a, b) => a.ref.localeCompare(b.ref)));
        toast.success("Entry added");
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: ImprovementEntry) {
    if (!confirm(`Delete entry ${item.ref} — ${item.title}?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const res = await fetch(`/api/improvement-log/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(initial);
      toast.error("Failed to delete");
    } else {
      toast.success("Entry deleted");
    }
  }

  return (
    <HubCard padded={false}>
      <div className="p-5">
        <HubCardHeader
          icon={<IconSparkles className="w-4 h-4" />}
          title="Improvement Log"
          subtitle="What broke · What changed · What the result was — the Kaizen loop without the ceremony."
          color="amber"
          action={
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={startAdd}>
              <IconPlus className="h-4 w-4" /> Log improvement
            </Button>
          }
          noBottomPadding
        />
      </div>

      <div className="px-5 pb-5">
        {showForm && (
          <div className="mb-5 space-y-3 rounded-xl border border-[var(--hub-border)] p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Ref</Label>
                <Input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="IL-001" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Process ref</Label>
                <Input value={form.process_ref ?? ""} onChange={(e) => setForm({ ...form, process_ref: e.target.value || null })} placeholder="SOP-001 (optional)" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>What broke</Label>
                <Textarea value={form.broke} onChange={(e) => setForm({ ...form, broke: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>What changed</Label>
                <Textarea value={form.changed} onChange={(e) => setForm({ ...form, changed: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Textarea value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{editing ? "Save changes" : "Log improvement"}</Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={<IconSparkles className="w-7 h-7" />}
            title="No improvements logged yet"
            description="When something breaks and you fix it, log it here: what broke, what changed, what the result was."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--hub-border)] p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-amber">{item.ref}</span>
                  <span className="font-semibold text-foreground flex-1 truncate">{item.title}</span>
                  {item.process_ref && <span className="font-mono text-xs text-muted-foreground">→ {item.process_ref}</span>}
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(item)}><IconPencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(item)}><IconTrash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/80">What broke</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.broke}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-teal">What changed</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.changed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-rose">Result</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </HubCard>
  );
}
