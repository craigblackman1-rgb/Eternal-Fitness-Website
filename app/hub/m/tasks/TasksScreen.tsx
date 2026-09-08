"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Task, TaskBucket, TaskStatus } from "@/types";

// ── helpers ────────────────────────────────────────────────────

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayISO(): string {
  return toLocalISODate(new Date());
}

function daysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

type DueGroup = "overdue" | "today" | "week" | "none" | "later";

function dueGroup(dueDate: string | null): DueGroup {
  if (!dueDate) return "none";
  const diff = daysUntilDue(dueDate);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "week";
  return "later";
}

function dueLabel(dueDate: string): { cls: string; text: string } {
  const g = dueGroup(dueDate);
  if (g === "overdue") {
    const diff = Math.abs(daysUntilDue(dueDate));
    return { cls: "overdue", text: `${diff}d overdue` };
  }
  if (g === "today") return { cls: "today", text: "Due today" };
  if (g === "week") {
    const diff = daysUntilDue(dueDate);
    if (diff === 1) return { cls: "soon", text: "Due tomorrow" };
    const d = new Date(`${dueDate}T00:00:00`);
    return { cls: "soon", text: `Due ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` };
  }
  // none or later — show the date
  const d = new Date(`${dueDate}T00:00:00`);
  return { cls: "soon", text: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function nextStatus(s: TaskStatus): TaskStatus {
  if (s === "todo") return "in_progress";
  if (s === "in_progress") return "done";
  return "todo";
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

type SegKey = "all" | TaskStatus;

const DUE_CHIPS = [
  { key: "all" as const, label: "All" },
  { key: "overdue" as const, label: "Overdue", danger: true },
  { key: "today" as const, label: "Today" },
  { key: "week" as const, label: "This week" },
  { key: "none" as const, label: "No date" },
] as const;

type DueChipKey = (typeof DUE_CHIPS)[number]["key"];

function matchesDue(task: Task, key: DueChipKey): boolean {
  if (key === "all") return true;
  const g = dueGroup(task.due_date);
  if (key === "week") return g === "week" || g === "today" || g === "overdue";
  return g === key;
}

const ASSIGNEE_OPTIONS = ["Unassigned", "Esther Fair", "Craig Blackman"];

// ── icons ──────────────────────────────────────────────────────

const ICO = {
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18M7 12h10M11 19h2" />
    </svg>
  ),
  close: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  plus: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  empty: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6.5 4.6 8 8 4.5M3 12.5 4.6 14 8 10.5M3 18.5 4.6 20 8 16.5M11 6h10M11 12h10M11 18h10" />
    </svg>
  ),
};

// ── component ──────────────────────────────────────────────────

interface TasksScreenProps {
  initialTasks: Task[];
  initialBuckets: TaskBucket[];
  currentUserName: string | null;
  clients: { id: string; name: string }[];
}

export function TasksScreen({ initialTasks, initialBuckets, currentUserName, clients }: TasksScreenProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const buckets = initialBuckets;
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  // Filters
  const [seg, setSeg] = useState<SegKey>("all");
  const [dueChip, setDueChip] = useState<DueChipKey>("all");
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [bucketFilter, setBucketFilter] = useState<string | null>(null);

  // Sheets
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<{ client: string | null; bucket: string | null }>({ client: null, bucket: null });
  const [newSheetOpen, setNewSheetOpen] = useState(false);

  // New task form
  const [newForm, setNewForm] = useState({
    title: "",
    description: "",
    assignee: currentUserName && ASSIGNEE_OPTIONS.includes(currentUserName) ? currentUserName : "Unassigned",
    bucket_id: "",
    due_date: "",
    client_id: "",
  });
  const [creating, setCreating] = useState(false);

  // ── derived data ─────────────────────────────────────────────

  const openTasks = useMemo(() => tasks.filter((t) => t.status !== "done"), [tasks]);

  const counts = useMemo(() => {
    const all = openTasks.length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { all, todo, in_progress: inProgress, done };
  }, [tasks, openTasks]);

  const dueCounts = useMemo(() => {
    const base = openTasks;
    return {
      all: base.length,
      overdue: base.filter((t) => dueGroup(t.due_date) === "overdue").length,
      today: base.filter((t) => dueGroup(t.due_date) === "today").length,
      week: base.filter((t) => {
        const g = dueGroup(t.due_date);
        return g === "week" || g === "today" || g === "overdue";
      }).length,
      none: base.filter((t) => dueGroup(t.due_date) === "none").length,
    };
  }, [openTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (seg !== "all" && t.status !== seg) return false;
      if (!matchesDue(t, dueChip)) return false;
      if (clientFilter && t.client_id !== clientFilter) return false;
      if (bucketFilter && t.bucket_id !== bucketFilter) return false;
      return true;
    });
  }, [tasks, seg, dueChip, clientFilter, bucketFilter]);

  const activeFilterCount = (clientFilter ? 1 : 0) + (bucketFilter ? 1 : 0);

  const overdueCount = useMemo(
    () => tasks.filter((t) => t.status !== "done" && dueGroup(t.due_date) === "overdue").length,
    [tasks],
  );

  // ── actions ──────────────────────────────────────────────────

  const advanceStatus = useCallback(
    async (task: Task) => {
      const newSt = nextStatus(task.status);
      setBusyIds((prev) => new Set(prev).add(task.id));
      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newSt } : t)));
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newSt }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
        router.refresh();
      } catch (err) {
        // Revert
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
        toast.error(err instanceof Error ? err.message : "Failed to update task");
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }
    },
    [router],
  );

  const createTask = useCallback(async () => {
    if (!newForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: newForm.title.trim(),
        description: newForm.description.trim() || null,
        assignee: newForm.assignee === "Unassigned" ? null : newForm.assignee,
        bucket_id: newForm.bucket_id || null,
        due_date: newForm.due_date || null,
        client_id: newForm.client_id || null,
        status: "todo" as TaskStatus,
      };
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create");
      const created = await res.json();
      setTasks((prev) => [created, ...prev]);
      setNewSheetOpen(false);
      setNewForm({
        title: "",
        description: "",
        assignee: currentUserName && ASSIGNEE_OPTIONS.includes(currentUserName) ? currentUserName : "Unassigned",
        bucket_id: "",
        due_date: "",
        client_id: "",
      });
      toast.success("Task created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  }, [newForm, currentUserName]);

  const applyFilters = useCallback(() => {
    setClientFilter(filterDraft.client);
    setBucketFilter(filterDraft.bucket);
    setFilterSheetOpen(false);
  }, [filterDraft]);

  const clearFilters = useCallback(() => {
    setClientFilter(null);
    setBucketFilter(null);
    setDueChip("all");
    setSeg("all");
    setFilterDraft({ client: null, bucket: null });
    setFilterSheetOpen(false);
  }, []);

  // ── bucket/client name lookups ───────────────────────────────

  const bucketName = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return buckets.find((b) => b.id === id)?.name ?? null;
    },
    [buckets],
  );

  const clientName = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return clients.find((c) => c.id === id)?.name ?? null;
    },
    [clients],
  );

  // ── render helpers ───────────────────────────────────────────

  function renderTaskRow(task: Task) {
    const d = task.due_date ? dueLabel(task.due_date) : null;
    const isDone = task.status === "done";
    const isOverdue = d?.cls === "overdue" && !isDone;
    const cName = clientName(task.client_id) ?? task.client_name;
    const bName = bucketName(task.bucket_id);
    const busy = busyIds.has(task.id);

    const label =
      task.status === "done"
        ? "Reopen task"
        : `Move to ${STATUS_LABELS[nextStatus(task.status)]}`;

    return (
      <div
        key={task.id}
        className={`trow st-${task.status}${isOverdue ? " is-overdue" : ""}${isDone ? " is-done" : ""}`}
      >
        <button
          className="tadv"
          onClick={() => advanceStatus(task)}
          disabled={busy}
          aria-label={`${label}: ${task.title}`}
        >
          <span className="ring">{ICO.check}</span>
        </button>
        <div className="tbody">
          <div className="ttitle-row">
            <span className="ttitle">{task.title}</span>
            {d && <span className={`tdue ${d.cls}`}>{d.text}</span>}
          </div>
          <div className="tmeta">
            {cName && (
              <span className="tclient">
                <span className="tav">{initials(cName)}</span>
                {cName}
              </span>
            )}
            {cName && bName && <span className="tsep">·</span>}
            {bName && <span className="tbucket">{bName}</span>}
          </div>
        </div>
      </div>
    );
  }

  function renderGroupedList() {
    if (filteredTasks.length === 0) {
      const what: string[] = [];
      if (seg !== "all") what.push(STATUS_LABELS[seg].toLowerCase());
      if (clientFilter) {
        const cn = clients.find((c) => c.id === clientFilter)?.name;
        if (cn) what.push(cn);
      }
      if (bucketFilter) {
        const bn = buckets.find((b) => b.id === bucketFilter)?.name;
        if (bn) what.push(bn);
      }
      if (dueChip !== "all") {
        what.push(DUE_CHIPS.find((c) => c.key === dueChip)?.label.toLowerCase() ?? "");
      }
      return (
        <div className="t-mempty">
          <div className="empty-ic">{ICO.empty}</div>
          <p className="empty-t">Nothing here</p>
          <p className="empty-d">
            No tasks match {what.join(" · ") || "the current filters"}. Clear the filters to see all {openTasks.length} open tasks.
          </p>
          <button className="btn btn-outline" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      );
    }

    if (seg !== "all") {
      return <div className="tlist">{filteredTasks.map(renderTaskRow)}</div>;
    }

    // Under "All" — group by status
    return (
      <>
        {(["todo", "in_progress", "done"] as TaskStatus[]).map((s) => {
          const group = filteredTasks.filter((t) => t.status === s);
          if (!group.length) return null;
          return (
            <div key={s}>
              <div className="sec-label">
                <h2>{STATUS_LABELS[s]}</h2>
                <span>{group.length}</span>
              </div>
              <div className="tlist">{group.map(renderTaskRow)}</div>
            </div>
          );
        })}
      </>
    );
  }

  // ── main render ──────────────────────────────────────────────

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <div className="mtop-id">
            <div className="mtop-t">Tasks</div>
            <div className="mtop-s">{openTasks.length} open · {overdueCount} overdue</div>
          </div>
        </div>

        {/* Segmented status control */}
        <div className="seg" role="group" aria-label="Task status">
          {([
            ["all", "All", counts.all],
            ["todo", "To do", counts.todo],
            ["in_progress", "In progress", counts.in_progress],
            ["done", "Done", counts.done],
          ] as [SegKey, string, number][]).map(([key, label, count]) => (
            <button
              key={key}
              className={`seg-btn${seg === key ? " on" : ""}`}
              onClick={() => setSeg(key)}
              aria-pressed={seg === key}
            >
              {label}
              <i>{count}</i>
            </button>
          ))}
        </div>

        {/* Due chips + pinned Filters button */}
        <div className="filtbar">
          <div className="filtrow" role="group" aria-label="Due date">
            {DUE_CHIPS.map((c) => {
              const count = c.key === "all" ? null : dueCounts[c.key];
              return (
                <button
                  key={c.key}
                  className={`chip${dueChip === c.key ? " on" : ""}${c.danger ? " danger" : ""}`}
                  onClick={() => setDueChip(c.key)}
                  aria-pressed={dueChip === c.key}
                >
                  {c.label}
                  {count !== null && <span className="n">{count}</span>}
                </button>
              );
            })}
          </div>
          <button
            className={`chip filters${activeFilterCount ? " on" : ""}`}
            onClick={() => {
              setFilterDraft({ client: clientFilter, bucket: bucketFilter });
              setFilterSheetOpen(true);
            }}
            aria-label="Client and bucket filters"
          >
            {ICO.filter}
            Filters
            {activeFilterCount > 0 && <span className="n">{activeFilterCount}</span>}
          </button>
        </div>
      </header>

      <main className="mcontent has-fab">
        {renderGroupedList()}
      </main>

      {/* FAB */}
      <button
        className="fab fab-circle"
        onClick={() => setNewSheetOpen(true)}
        aria-label="New task"
      >
        {ICO.plus}
      </button>

      {/* Filter sheet */}
      {filterSheetOpen && (
        <>
          <div className="scrim" onClick={() => setFilterSheetOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Filter tasks">
            <div className="grab"><i /></div>
            <div className="sh-head">
              <div className="sh-title"><h1>Filters</h1></div>
              <button className="sh-close" onClick={() => setFilterSheetOpen(false)} aria-label="Close">
                {ICO.close}
              </button>
            </div>
            <div className="sh-body">
              <div className="field">
                <label>Client</label>
                <select
                  value={filterDraft.client ?? ""}
                  onChange={(e) => setFilterDraft((f) => ({ ...f, client: e.target.value || null }))}
                >
                  <option value="">Any client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Bucket</label>
                <select
                  value={filterDraft.bucket ?? ""}
                  onChange={(e) => setFilterDraft((f) => ({ ...f, bucket: e.target.value || null }))}
                >
                  <option value="">Any bucket</option>
                  {buckets.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <p className="hint">Status and due date stay in the header — they are the two used every day. These are the occasional ones, so they live a tap away rather than taking a second chip row.</p>
            </div>
            <div className="sh-foot">
              <button className="btn btn-ghost" onClick={clearFilters}>Clear</button>
              <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
            </div>
          </div>
        </>
      )}

      {/* New task sheet */}
      {newSheetOpen && (
        <>
          <div className="scrim" onClick={() => setNewSheetOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="New task">
            <div className="grab"><i /></div>
            <div className="sh-head">
              <div className="sh-title"><h1>New task</h1></div>
              <button className="sh-close" onClick={() => setNewSheetOpen(false)} aria-label="Close">
                {ICO.close}
              </button>
            </div>
            <div className="sh-body">
              <div className="field">
                <label htmlFor="nTitle">Title</label>
                <input
                  id="nTitle"
                  type="text"
                  placeholder="What needs doing?"
                  value={newForm.title}
                  onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="nDesc">Description</label>
                <textarea
                  id="nDesc"
                  rows={2}
                  placeholder="Optional"
                  value={newForm.description}
                  onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="nAssignee">Assignee</label>
                <select
                  id="nAssignee"
                  value={newForm.assignee}
                  onChange={(e) => setNewForm((f) => ({ ...f, assignee: e.target.value }))}
                >
                  {ASSIGNEE_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="nBucket">Bucket</label>
                <select
                  id="nBucket"
                  value={newForm.bucket_id}
                  onChange={(e) => setNewForm((f) => ({ ...f, bucket_id: e.target.value }))}
                >
                  <option value="">No bucket</option>
                  {buckets.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="nDue">Due date</label>
                <input
                  id="nDue"
                  type="date"
                  value={newForm.due_date}
                  onChange={(e) => setNewForm((f) => ({ ...f, due_date: e.target.value }))}
                />
                <p className="hint">Leave empty for no due date.</p>
              </div>
              <div className="field">
                <label htmlFor="nClient">Client</label>
                <select
                  id="nClient"
                  value={newForm.client_id}
                  onChange={(e) => setNewForm((f) => ({ ...f, client_id: e.target.value }))}
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sh-foot">
              <button className="btn btn-ghost" onClick={() => setNewSheetOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createTask} disabled={creating || !newForm.title.trim()}>
                Create task
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
