"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookText,
  LogOut,
  ClipboardList,
  FileSignature,
} from "lucide-react";

const navItems = [
  { href: "/hub", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hub/clients", label: "Clients", icon: Users },
  { href: "/hub/exercises", label: "Exercise Library", icon: BookText },
  { href: "/hub/tracker", label: "Medical Tracker", icon: ClipboardList },
  { href: "/hub/agreements", label: "Agreements", icon: FileSignature },
];

export function HubSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/hub/login");
  };

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      {/* Brand header */}
      <div className="flex items-center gap-3 p-5">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="hsl(186, 89%, 29%)" />
          <path d="M16 26c-5.5 0-10-4.5-10-10S10.5 6 16 6s10 4.5 10 10-4.5 10-10 10z" fill="white" opacity="0.2" />
          <path d="M16 24c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="white" opacity="0.3" />
          <path d="M16 22c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="white" />
          <path d="M19 10l-3 10-3-4-4 3" stroke="hsl(186, 89%, 29%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <div>
          <span className="text-sm font-bold text-accent">Eternal Fitness</span>
          <p className="text-xs text-muted-foreground">Trainer Hub</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/hub" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-accent/15 text-accent font-semibold"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-accent" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
            EF
          </div>
          <div className="text-xs">
            <p className="font-medium text-foreground">Esther Fair</p>
            <p className="text-muted-foreground">Level 4 PT</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground rounded-lg"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
