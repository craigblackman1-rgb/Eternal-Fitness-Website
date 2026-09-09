"use client";

import { useMemo, useState, useEffect } from "react";
import type { TaskListItem } from "./page";

const ICO = {
  check: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  empty: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
};

type Segment = "open" | "done";

function dueChip(dueDate: string | null): { label: string; cls: string } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return { label: "Overdue", cls: "overdue" };
  if (diffDays === 0) return { label: "Today", cls: "today" };
  if (diffDays === 1) return { label: "Tomorrow", cls: "soon" };
  return { label: due.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), cls: "soon" };
}

interface ClientOption {
  id: string;
  name: string;
  client_number: number;
}

interface Props {
  tasks: TaskListItem[];
}

export function TasksScreen({ tasks }: Props) {
  const [seg, setSeg] = useState<Segment>("open");
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Add-task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [clientQuery, setClientQuery] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status === "todo" || t.status === "in_progress"),
    [tasks],
  );

  const doneToday = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== "done") return false;
      // updated_at is set when status changes to done — best proxy for completed_at
      const updated = new Date(t.updated_at);
      return updated.toISOString().slice(0, 10) === todayStr;
    });
  }, [tasks, todayStr]);

  const filtered = seg === "open" ? openTasks : doneToday;

  async function loadClients() {
    if (clients.length > 0 || clientsLoading) return;
    setClientsLoading(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(
          (Array.isArray(data) ? data : []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            client_number: c.client_number as number,
          })),
        );
      }
    } catch { /* ignore */ }
    setClientsLoading(false);
  }

  function openAddSheet() {
    setShowAdd(true);
    setNewTitle("");
    setNewDue("");
    setNewClientId(null);
    setClientQuery("");
    loadClients();
  }

  const filteredClients = useMemo(() => {
    if (!clientQuery.trim()) return clients;
    const q = clientQuery.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientQuery]);

  async function createTask() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          due_date: newDue || null,
          client_id: newClientId,
          status: "todo",
        }),
      });
      if (res.ok) {
        showToast("Task added");
        setShowAdd(false);
        // Refresh by reloading the page data
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Could not create task");
      }
    } catch {
      showToast("Network error");
    }
    setSaving(false);
  }

  async function toggleComplete(task: TaskListItem) {
    const newStatus = task.status === "done" ? "todo" : "done";
    setCompletingId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Optimistic local update
        window.location.reload();
      } else {
        showToast("Could not update task");
      }
    } catch {
      showToast("Network error");
    }
    setCompletingId(null);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <div className="mtop-id">
            <div className="mtop-t">Tasks</div>
            <div className="mtop-s">{openTasks.length} open</div>
          </div>
        </div>
      </header>

      <main className="mcontent">
        <div className="seg" style={{ marginBottom: 14 }}>
          <button
            className={`seg-btn${seg === "open" ? " on" : ""}`}
            onClick={() => setSeg("open")}
            aria-pressed={seg === "open"}
          >
            Open
            <span className="seg-count">{openTasks.length}</span>
          </button>
          <button
            className={`seg-btn${seg === "done" ? " on" : ""}`}
            onClick={() => setSeg("done")}
            aria-pressed={seg === "done"}
          >
            Done today
            <span className="seg-count">{doneToday.length}</span>
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-ic">{ICO.empty}</div>
            <p className="empty-t">
              {seg === "open" ? "All done" : "Nothing completed today"}
            </p>
            <p className="empty-d">
              {seg === "open"
                ? "No open tasks. Tap + to add one."
                : "Tasks completed today will appear here."}
            </p>
          </div>
        ) : (
          <div className="tlist">
            {filtered.map((task) => {
              const chip = dueChip(task.due_date);
              const isDone = task.status === "done";
              return (
                <div key={task.id} className={`trow${isDone ? " is-done" : ""}`}>
                  <button
                    className="tcheck"
                    onClick={() => toggleComplete(task)}
                    disabled={completingId === task.id}
                    aria-label={isDone ? "Mark as open" : "Mark as done"}
                  >
                    {ICO.check}
                  </button>
                  <div className="tbody">
                    <div className="ttitle">{task.title}</div>
                    <div className="tmeta">
                      {task.client_name && <span>{task.client_name}</span>}
                      {!task.client_name && task.assignee && <span>{task.assignee}</span>}
                    </div>
                  </div>
                  {chip && !isDone && (
                    <span className={`tdue ${chip.cls}`}>{chip.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {seg === "open" && (
          <button className="fab" onClick={openAddSheet}>
            {ICO.plus}
            Add task
          </button>
        )}
      </main>

      {showAdd && <div className="scrim" onClick={() => setShowAdd(false)} />}
      {showAdd && (
        <div className="sheet">
          <div className="grab"><i /></div>
          <div className="sh-head">
            <div className="sh-title">
              <h1>New task</h1>
            </div>
            <button className="sh-close" onClick={() => setShowAdd(false)} aria-label="Close">
              {ICO.close}
            </button>
          </div>
          <div className="sh-body">
            <div className="field">
              <label htmlFor="task-title">Title</label>
              <input
                id="task-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs doing?"
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="task-due">Due date</label>
              <input
                id="task-due"
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Client (optional)</label>
              {newClientId ? (
                <div className="edit-tag-list">
                  <span className="edit-tag">
                    {clients.find((c) => c.id === newClientId)?.name ?? "Client"}
                    <button
                      className="ex-tag-x"
                      onClick={() => setNewClientId(null)}
                      aria-label="Remove client"
                    >
                      ×
                    </button>
                  </span>
                </div>
              ) : (
                <>
                  <input
                    type="search"
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder={clientsLoading ? "Loading clients…" : "Search clients…"}
                    disabled={clientsLoading}
                  />
                  {clientQuery && filteredClients.length > 0 && (
                    <div className="task-client-pick">
                      {filteredClients.slice(0, 5).map((c) => (
                        <button
                          key={c.id}
                          className="pick-item"
                          onClick={() => {
                            setNewClientId(c.id);
                            setClientQuery("");
                          }}
                        >
                          <div className="pick-b">
                            <div className="pick-t">{c.name}</div>
                            <div className="pick-m">#{c.client_number}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={saving || !newTitle.trim()}
                onClick={createTask}
              >
                {saving ? "Saving…" : "Add task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </>
  );
}
