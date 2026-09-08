"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function TabIcon({ type }: { type: "today" | "calendar" | "train" | "clients" | "tasks" }) {
  if (type === "today") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    );
  }
  if (type === "calendar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M3 15h18M12 15v3"/>
      </svg>
    );
  }
  if (type === "train") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5v11M17.5 6.5v11M3 10h1.5M3 14h1.5M19.5 10H21M19.5 14H21M9 10h6v4H9z"/>
      </svg>
    );
  }
  if (type === "tasks") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6.5 4.6 8 8 4.5M3 12.5 4.6 14 8 10.5M3 18.5 4.6 20 8 16.5M11 6h10M11 12h10M11 18h10"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  );
}

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [overdueCount, setOverdueCount] = useState(0);

  // Fetch overdue task count for the tab badge. Runs once on mount and after
  // navigations that land on a task-related route.
  useEffect(() => {
    let cancelled = false;
    async function fetchOverdue() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) return;
        const tasks = await res.json();
        if (!Array.isArray(tasks)) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let count = 0;
        for (const t of tasks) {
          if (t.status === "done" || !t.due_date) continue;
          const due = new Date(`${t.due_date}T00:00:00`);
          if (Math.round((due.getTime() - today.getTime()) / 86_400_000) < 0) count++;
        }
        if (!cancelled) setOverdueCount(count);
      } catch {
        // Badge is cosmetic — swallow the error.
      }
    }
    fetchOverdue();
    return () => { cancelled = true; };
  }, [pathname]);

  const activeTab = useMemo(() => {
    if (pathname === "/hub/m") return "today";
    if (pathname.startsWith("/hub/m/calendar")) return "calendar";
    if (pathname.startsWith("/hub/m/train")) return "train";
    if (pathname.startsWith("/hub/m/clients")) return "clients";
    if (pathname.startsWith("/hub/m/tasks")) return "tasks";
    return "today";
  }, [pathname]);

  // Client mode (`/hub/m/clients/[client_number]`) owns its own bottom tab
  // bar (Overview / Calendar / Workouts / Notes) — the trainer bar is replaced
  // while scoped into a client, matching hub-m-client-mode.html. Book Session
  // is a focused task flow with no tab bar of its own in the mockup either.
  const inClientMode = useMemo(
    () => /^\/hub\/m\/clients\/[^/]+/.test(pathname) || pathname.startsWith("/hub/m/book"),
    [pathname],
  );

  return (
    <div className="mobile-shell">
      {children}
      {!inClientMode && (
      <nav className="tabbar" aria-label="Primary">
        <Link
          className={`tab${activeTab === "today" ? " on" : ""}`}
          href="/hub/m"
          {...(activeTab === "today" ? { "aria-current": "page" as const } : {})}
        >
          <TabIcon type="today" />
          Today
        </Link>
        <Link
          className={`tab${activeTab === "calendar" ? " on" : ""}`}
          href="/hub/m/calendar"
          {...(activeTab === "calendar" ? { "aria-current": "page" as const } : {})}
        >
          <TabIcon type="calendar" />
          Calendar
        </Link>
        <Link
          className={`tab${activeTab === "train" ? " on" : ""}`}
          href="/hub/m/train"
          {...(activeTab === "train" ? { "aria-current": "page" as const } : {})}
        >
          <TabIcon type="train" />
          Train
        </Link>
        <Link
          className={`tab${activeTab === "clients" ? " on" : ""}`}
          href="/hub/m/clients"
          {...(activeTab === "clients" ? { "aria-current": "page" as const } : {})}
        >
          <TabIcon type="clients" />
          Clients
        </Link>
        <Link
          className={`tab${activeTab === "tasks" ? " on" : ""}`}
          href="/hub/m/tasks"
          {...(activeTab === "tasks" ? { "aria-current": "page" as const } : {})}
        >
          <TabIcon type="tasks" />
          <span className="tab-lbl">Tasks</span>
          {overdueCount > 0 && <span className="tab-badge">{overdueCount}</span>}
        </Link>
      </nav>
      )}
    </div>
  );
}
