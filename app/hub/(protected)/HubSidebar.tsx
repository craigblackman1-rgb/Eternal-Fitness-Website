"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import EternalFitnessLogo from "@/components/EternalFitnessLogo";
import {
  IconBarChart3,
  IconCalendar,
  IconClipboardList,
  IconDumbbell,
  IconFileSignature,
  IconLayoutDashboard,
  IconLogOut,
  IconPencil,
  IconUsers,
} from "@/components/icons";

const navItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/hub", label: "Today", icon: IconLayoutDashboard },
  { href: "/hub/schedule", label: "Schedule", icon: IconCalendar },
  { href: "/hub/clients", label: "Clients", icon: IconUsers },
  { href: "/hub/workouts", label: "Library", icon: IconDumbbell },
  { href: "/hub/document-templates", label: "Documents", icon: IconFileSignature },
  { href: "/hub/compliance", label: "Compliance", icon: IconClipboardList },
  { href: "/hub/cashflow", label: "Finance", icon: IconBarChart3 },
  { href: "/hub/settings", label: "Settings", icon: IconPencil },
];

export function HubSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/hub/login");
  };

  return (
    <div className="flex h-full w-60 shrink-0 flex-col bg-[var(--hub-sidebar)] text-white">
      <div className="flex flex-col items-start justify-center gap-1 px-5 py-3 border-b border-white/[0.07]">
        <EternalFitnessLogo variant="light" className="h-9 w-auto" />
        <span className="text-[11px] text-white/40 tracking-wide uppercase">Trainer Hub</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/hub" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100",
                isActive
                  ? "bg-[var(--hub-sidebar-active)] text-white"
                  : "text-white/55 hover:text-white hover:bg-[var(--hub-sidebar-hover)]",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-pill bg-rose" />
              )}
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-rose" : "text-white/45")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-pill bg-rose/20 text-rose flex items-center justify-center text-xs font-bold shrink-0">
            EF
          </div>
          <div className="text-xs min-w-0 flex-1">
            <p className="font-semibold text-white truncate">Esther Fair</p>
            <p className="text-white/40">Level 4 Cancer & Exercise Rehab</p>
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
