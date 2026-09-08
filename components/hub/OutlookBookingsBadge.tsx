"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconCalendar } from "@/components/icons";

/** Returns the combined count of open Outlook bookings + possible duplicates,
 *  or null until both fetches have resolved. */
export function useOutlookTriageCount(): number | null {
  const [bookingsCount, setBookingsCount] = useState<number | null>(null);
  const [duplicatesCount, setDuplicatesCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/outlook-bookings?status=open&count=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled) setBookingsCount(body?.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setBookingsCount(0);
      });
    fetch("/api/outlook-duplicates?status=open&count=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled) setDuplicatesCount(body?.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setDuplicatesCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (bookingsCount === null || duplicatesCount === null) return null;
  return bookingsCount + duplicatesCount;
}

/** CR-EF-136 — Returns the total count across all six triage queues
 *  (bookings, duplicates, unassigned, pending deletions, cancellations,
 *  lapses) or null until all fetches have resolved. Used by the sidebar
 *  badge on the Schedule entry. */
export function useTriageTotalCount(): number | null {
  const [counts, setCounts] = useState<Record<string, number | null>>({
    bookings: null,
    duplicates: null,
    unassigned: null,
    pending: null,
    cancellations: null,
    lapses: null,
  });

  useEffect(() => {
    let cancelled = false;

    const endpoints: [string, string][] = [
      ["bookings", "/api/outlook-bookings?status=open&count=true"],
      ["duplicates", "/api/outlook-duplicates?status=open&count=true"],
      ["unassigned", "/api/sessions/unassigned-outlook?count=true"],
      ["cancellations", "/api/sessions/cancellation-count"],
      ["lapses", "/api/sessions/lapse-count"],
    ];

    // Pending deletions: no count endpoint, fetch full list and count
    fetch("/api/calendar-sync-pending-actions", { signal: AbortSignal.timeout(15000) })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setCounts((c) => ({ ...c, pending: Array.isArray(data) ? data.length : 0 }));
      })
      .catch(() => {
        if (!cancelled) setCounts((c) => ({ ...c, pending: 0 }));
      });

    for (const [key, url] of endpoints) {
      fetch(url, { signal: AbortSignal.timeout(15000) })
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => {
          if (!cancelled) setCounts((c) => ({ ...c, [key]: body?.count ?? 0 }));
        })
        .catch(() => {
          if (!cancelled) setCounts((c) => ({ ...c, [key]: 0 }));
        });
    }

    return () => { cancelled = true; };
  }, []);

  const values = Object.values(counts);
  if (values.some((v) => v === null)) return null;
  return values.reduce((a, b) => a + (b ?? 0), 0);
}

/** CR-EF-050/CR-EF-028 — route-in badge for the two Outlook reconciliation
 *  queues (Bookings, Possible duplicates), shown on both the day and month
 *  schedule views. Combines both counts, matching the mockup's single badge.
 *  Renders nothing until both counts are known, and nothing at all when
 *  there's nothing to reconcile. */
export function OutlookBookingsBadge() {
  const total = useOutlookTriageCount();

  if (total === null || total === 0) return null;

  return (
    <Button variant="outline" asChild className="relative rounded-lg pr-7">
      <Link href="/hub/schedule/triage" title="Resolve calendar items that need your attention — bookings, duplicates, unassigned sessions, pending deletions, cancellations, and lapses">
        <IconCalendar className="h-4 w-4 mr-1.5" />
        Triage
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-pill bg-[var(--color-rose)] text-white text-[11px] font-bold leading-5 text-center px-1 border-2 border-[var(--hub-card)]">
          {total}
        </span>
      </Link>
    </Button>
  );
}
