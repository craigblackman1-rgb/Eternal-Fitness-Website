"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { IconBookText, IconCheckSquare, IconClipboardList, IconFileSignature, IconLayoutDashboard, IconLogOut, IconSearch, IconUsers } from "@/components/icons";

interface ClientSearchResult {
  client_number: number;
  name: string;
}

function ClientQuickSearch() {
  const supabase = createClient();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("clients")
        .select("client_number, name")
        .ilike("name", `%${term.trim()}%`)
        .order("name", { ascending: true })
        .limit(6);
      if (!cancelled) setResults(data ?? []);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [term]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (clientNumber: number) => {
    setOpen(false);
    setTerm("");
    router.push(`/hub/clients/${clientNumber}`);
  };

  return (
    <div ref={containerRef} className="relative px-3 pt-3">
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Find a client..."
          className="w-full rounded-xl bg-white/10 border border-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-rose/40"
        />
      </div>
      {open && term.trim().length >= 2 && (
        <div className="absolute left-3 right-3 z-20 mt-1 rounded-xl border border-border/60 bg-white shadow-lg overflow-hidden">
          {results.length > 0 ? (
            results.map((c) => (
              <button
                key={c.client_number}
                onClick={() => goTo(c.client_number)}
                className="flex w-full items-center px-3 py-2 text-left text-sm text-foreground hover:bg-rose/5 transition-colors"
              >
                {c.name}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">No clients found</p>
          )}
        </div>
      )}
    </div>
  );
}

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
    <aside className="flex w-64 flex-col bg-dark-navy text-white">
      {/* Brand header */}
      <div className="flex items-center gap-3 p-5 border-b border-white/10">
        <div className="w-9 h-9 relative shrink-0">
          <Image src="/images/ef-heart-logo-white.svg" alt="Eternal Fitness" fill />
        </div>
        <div>
          <span className="text-sm font-semibold text-white leading-tight block">Eternal Fitness Hub</span>
          <span className="text-xs text-white/50">Trainer Portal</span>
        </div>
      </div>

      <ClientQuickSearch />

      {/* Navigation */}
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
                  ? "bg-rose text-white font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : "text-white/60")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-3 bg-white/10" />

      {/* User section */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mx-1">
          <div className="w-8 h-8 rounded-full bg-rose text-white flex items-center justify-center text-xs font-bold shrink-0">
            EF
          </div>
          <div className="text-xs min-w-0">
            <p className="font-semibold text-white truncate">Esther Fair</p>
            <p className="text-white/50">Level 4 PT</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl mt-1"
          onClick={handleSignOut}
        >
          <IconLogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
