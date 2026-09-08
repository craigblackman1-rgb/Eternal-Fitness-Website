"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import EternalFitnessLogo from "@/components/EternalFitnessLogo";
import { useTriageTotalCount } from "@/components/hub";
import {
  IconBarChart3,
  IconCalendar,
  IconCheckSquare,
  IconChevronDown,
  IconClipboardList,
  IconDumbbell,
  IconFileSignature,
  IconLayoutDashboard,
  IconLogOut,
  IconMail,
  IconPencil,
  IconUsers,
} from "@/components/icons";

type NavChild = {
  href: string;
  label: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
};

type NavGroup = {
  group?: string;
  items: NavItem[];
};

const navStructure: NavGroup[] = [
  {
    items: [
      { href: "/hub", label: "Today", icon: IconLayoutDashboard },
      {
        href: "/hub/schedule",
        label: "Schedule",
        icon: IconCalendar,
        children: [
          { href: "/hub/schedule/triage", label: "Triage" },
          { href: "/hub/schedule/availability", label: "Availability" },
          { href: "/hub/schedule/outlook", label: "Outlook" },
        ],
      },
      { href: "/hub/clients", label: "Clients", icon: IconUsers },
      { href: "/hub/tasks", label: "Tasks", icon: IconCheckSquare },
    ],
  },
  {
    group: "Training",
    items: [
      { href: "/hub/programs", label: "Programmes", icon: IconDumbbell },
      {
        href: "/hub/workouts",
        label: "Library",
        icon: IconDumbbell,
        children: [
          { href: "/hub/workouts", label: "Workout templates" },
          { href: "/hub/exercises", label: "Exercise library" },
        ],
      },
    ],
  },
  {
    group: "Admin",
    items: [
      {
        href: "/hub/document-templates",
        label: "Documents",
        icon: IconFileSignature,
        children: [
          { href: "/hub/document-templates", label: "Templates" },
          { href: "/hub/documents", label: "Sent documents" },
          { href: "/hub/agreements", label: "Agreements" },
        ],
      },
      { href: "/hub/reports/updates", label: "Updates", icon: IconMail },
      { href: "/hub/compliance", label: "Compliance", icon: IconClipboardList },
    ],
  },
  {
    group: "Business",
    items: [
      {
        href: "/hub/cashflow",
        label: "Finance",
        icon: IconBarChart3,
        children: [
          { href: "/hub/cashflow/invoices", label: "Invoices" },
          { href: "/hub/cashflow/transactions", label: "Transactions" },
          { href: "/hub/cashflow/forecast", label: "Forecast" },
        ],
      },
    ],
  },
];

function isChildActive(pathname: string, children: NavChild[]): boolean {
  return children.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
  );
}

export function HubSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const triageTotal = useTriageTotalCount();

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of navStructure) {
      for (const item of group.items) {
        if (item.children?.length) {
          initial[item.href] = isChildActive(pathname, item.children);
        }
      }
    }
    return initial;
  });

  const toggleBranch = (href: string) => {
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/hub/login");
  };

  return (
    <div className="flex h-full w-60 shrink-0 flex-col bg-[var(--hub-sidebar)] text-white">
      <div className="flex flex-col items-start justify-center gap-1 px-5 py-3 border-b border-white/[0.07]">
        <EternalFitnessLogo variant="light" className="h-9 w-auto" />
        <span className="text-[11px] text-white/40 tracking-wide uppercase">
          Trainer Hub
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navStructure.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-3" : undefined}>
            {group.group && (
              <p className="px-3 pt-1 pb-1 text-[10px] font-semibold tracking-widest uppercase text-white/30">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const branchOpen = hasChildren && (expanded[item.href] ?? false);
              const isActive =
                !hasChildren &&
                (pathname === item.href ||
                  (item.href !== "/hub" &&
                    pathname.startsWith(item.href + "/")));

              return (
                <div key={item.href}>
                  <div className="relative flex items-center">
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100 flex-1 min-w-0",
                        isActive
                          ? "bg-[var(--hub-sidebar-active)] text-white"
                          : branchOpen
                            ? "text-white/75 hover:text-white hover:bg-[var(--hub-sidebar-hover)]"
                            : "text-white/55 hover:text-white hover:bg-[var(--hub-sidebar-hover)]",
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-pill bg-rose" />
                      )}
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-rose" : "text-white/45",
                        )}
                      />
                      {item.label}
                      {item.href === "/hub/schedule" &&
                        triageTotal !== null &&
                        triageTotal > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-pill bg-rose text-white text-[10px] font-bold px-1">
                            {triageTotal}
                          </span>
                        )}
                    </Link>
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggleBranch(item.href)}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors shrink-0",
                          branchOpen
                            ? "text-white/60 hover:text-white hover:bg-[var(--hub-sidebar-hover)]"
                            : "text-white/30 hover:text-white/60 hover:bg-[var(--hub-sidebar-hover)]",
                        )}
                        aria-expanded={branchOpen}
                      >
                        <IconChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-150",
                            branchOpen && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {hasChildren && branchOpen && (
                    <div className="ml-5 mt-0.5 space-y-0.5">
                      {item.children!.map((child) => {
                        const childActive =
                          child.href === item.href
                            ? false
                            : pathname === child.href ||
                              pathname.startsWith(child.href + "/");
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              "relative flex items-center rounded-lg pl-[40px] pr-3 py-1.5 text-[13px] font-medium transition-colors duration-100",
                              childActive
                                ? "bg-[var(--hub-sidebar-active)] text-white"
                                : "text-white/55 hover:text-white hover:bg-[var(--hub-sidebar-hover)]",
                            )}
                          >
                            {childActive && (
                              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-pill bg-rose" />
                            )}
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div className="my-2 border-t border-white/[0.07]" />
        <Link
          href="/hub/settings"
          onClick={onNavigate}
          className={cn(
            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100",
            pathname === "/hub/settings" ||
              pathname.startsWith("/hub/settings/")
              ? "bg-[var(--hub-sidebar-active)] text-white"
              : "text-white/55 hover:text-white hover:bg-[var(--hub-sidebar-hover)]",
          )}
        >
          {(pathname === "/hub/settings" ||
            pathname.startsWith("/hub/settings/")) && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-pill bg-rose" />
          )}
          <IconPencil
            className={cn(
              "h-4 w-4 shrink-0",
              pathname === "/hub/settings" ||
                pathname.startsWith("/hub/settings/")
                ? "text-rose"
                : "text-white/45",
            )}
          />
          Settings
        </Link>
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-pill bg-rose/20 text-rose flex items-center justify-center text-xs font-bold shrink-0">
            EF
          </div>
          <div className="text-xs min-w-0 flex-1">
            <p className="font-semibold text-white truncate">Esther Fair</p>
            <p className="text-white/40">
              Level 4 Cancer &amp; Exercise Rehab
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-[var(--hub-sidebar-hover)] transition-colors"
          >
            <IconLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function HubSidebar() {
  return (
    <aside className="hidden lg:flex sticky top-0 h-screen">
      <HubSidebarNav />
    </aside>
  );
}
