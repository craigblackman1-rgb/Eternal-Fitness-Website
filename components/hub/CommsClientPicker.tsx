"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@/components/icons";

interface ClientSearchResult {
  client_number: number;
  name: string;
}

export function CommsClientPicker() {
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
      const res = await fetch(`/api/clients?search=${encodeURIComponent(term.trim())}`);
      if (!cancelled) {
        if (res.ok) {
          const data = await res.json();
          setResults(data ?? []);
        } else {
          setResults([]);
        }
      }
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
    router.push(`/hub/clients/${clientNumber}/comms/new`);
  };

  return (
    <div ref={containerRef} className="relative">
      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Pick a client to write to…"
        className="h-9 w-64 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] pl-9 pr-3 text-[13px] font-[inherit] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-rose focus:shadow-[0_0_0_3px_rgba(193,131,159,.3)] transition-colors"
      />
      {open && term.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 rounded-surface border border-[var(--hub-border)] bg-white shadow-lg overflow-hidden">
          {results.length > 0 ? (
            results.map((c) => (
              <button
                key={c.client_number}
                onClick={() => goTo(c.client_number)}
                className="flex w-full items-center px-3 py-2 text-left text-[13px] text-foreground hover:bg-[var(--hub-hover)] transition-colors"
              >
                {c.name}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-[13px] text-muted-foreground">No clients found</p>
          )}
        </div>
      )}
    </div>
  );
}
