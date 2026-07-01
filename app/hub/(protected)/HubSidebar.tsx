"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { IconBookText, IconCheckSquare, IconClipboardList, IconFileSignature, IconLayoutDashboard, IconLogOut, IconUsers } from "@/components/icons";

const navItems = [
  { href: "/hub", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/hub/clients", label: "Clients", icon: IconUsers },
  { href: "/hub/exercises", label: "Exercise Library", icon: IconBookText },
  { href: "/hub/tracker", label: "Medical Tracker", icon: IconClipboardList },
  { href: "/hub/agreements", label: "Agreements", icon: IconFileSignature },
  { href: "/hub/site-review", label: "Site Review Tasks", icon: IconCheckSquare },
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
    <aside className="flex w-64 flex-col border-r bg-white">
      {/* Brand header — uses Eternal Fitness rose + real identity */}
      <div className="flex items-center gap-3 p-5 border-b border-border/50">
        <div className="w-9 h-9 rounded-xl bg-rose flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 26c-5.5 0-10-4.5-10-10S10.5 6 16 6s10 4.5 10 10-4.5 10-10 10z" fill="white" opacity="0.3" />
            <path d="M16 24c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="white" opacity="0.5" />
            <path d="M16 22c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="white" />
            <path d="M19 10l-3 10-3-4-4 3" stroke="var(--color-rose)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-bold text-rose leading-tight block">Eternal Fitness</span>
          <span className="text-xs text-muted-foreground">Trainer Hub</span>
        </div>
      </div>

      {/* Navigation — rose active state matching website */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/hub" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-rose/10 text-rose font-semibold"
                  : "text-slate hover:bg-off-white hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-rose" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-3" />

      {/* User section — warm, personal */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-off-white/60 mx-1">
          <div className="w-8 h-8 rounded-full bg-rose text-white flex items-center justify-center text-xs font-bold shrink-0">
            EF
          </div>
          <div className="text-xs min-w-0">
            <p className="font-semibold text-foreground truncate">Esther Fair</p>
            <p className="text-muted-foreground">Level 4 PT</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-off-white rounded-xl mt-1"
          onClick={handleSignOut}
        >
          <IconLogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
