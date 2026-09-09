"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type TabKey = "training" | "calendar" | "documents" | "comms" | "notes";

const ICO = {
  pool: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 9v12" />
    </svg>
  ),
  calendarTab: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M3 15h18M12 15v3" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  ),
  comms: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

interface ClientTabBarProps {
  clientNumber: number;
  activeTab: TabKey;
}

const tabs: { key: TabKey; label: string; icon: ReactNode; href: (n: number) => string }[] = [
  { key: "training", label: "Training", icon: ICO.pool, href: (n) => `/hub/m/clients/${n}?tab=training` },
  { key: "calendar", label: "Calendar", icon: ICO.calendarTab, href: (n) => `/hub/m/clients/${n}?tab=calendar` },
  { key: "documents", label: "Documents", icon: ICO.documents, href: (n) => `/hub/m/clients/${n}/documents` },
  { key: "comms", label: "Comms", icon: ICO.comms, href: (n) => `/hub/m/clients/${n}/comms` },
  { key: "notes", label: "Notes", icon: ICO.notes, href: (n) => `/hub/m/clients/${n}?tab=notes` },
];

export function ClientTabBar({ clientNumber, activeTab }: ClientTabBarProps) {
  return (
    <nav className="tabbar" aria-label="Client">
      {tabs.map((t) => (
        <Link
          key={t.key}
          className={`tab${activeTab === t.key ? " on" : ""}`}
          href={t.href(clientNumber)}
          aria-current={activeTab === t.key ? "true" : undefined}
        >
          {t.icon}
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
