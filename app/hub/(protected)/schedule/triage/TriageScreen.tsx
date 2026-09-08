"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HubPageHeader } from "@/components/hub";
import { OutlookBookingsQueue } from "../outlook/OutlookBookingsQueue";
import { OutlookDuplicatesQueue } from "../outlook/duplicates/OutlookDuplicatesQueue";
import { UnassignedOutlookSessions } from "../outlook/unassigned/UnassignedOutlookSessions";
import { CalendarSyncPendingQueue } from "../outlook/pending-deletions/CalendarSyncPendingQueue";
import { CancellationReview } from "@/components/hub/CancellationReview";
import { LapseReview } from "@/components/hub/LapseReview";
import { cn } from "@/lib/utils";

type FilterKey =
  | "bookings"
  | "duplicates"
  | "unassigned"
  | "pending-deletions"
  | "cancellations"
  | "lapses";

interface FilterDef {
  key: FilterKey;
  label: string;
  countKey: string;
  apiEndpoint: string;
}

const FILTERS: FilterDef[] = [
  { key: "bookings", label: "Unconfirmed bookings", countKey: "bookings", apiEndpoint: "/api/outlook-bookings?status=open&count=true" },
  { key: "duplicates", label: "Possible duplicates", countKey: "duplicates", apiEndpoint: "/api/outlook-duplicates?status=open&count=true" },
  { key: "unassigned", label: "Not matched to a client", countKey: "unassigned", apiEndpoint: "/api/sessions/unassigned-outlook?count=true" },
  { key: "pending-deletions", label: "Deleted in Outlook", countKey: "pending", apiEndpoint: "/api/calendar-sync-pending-actions" },
  { key: "cancellations", label: "Cancelled — decide the charge", countKey: "cancellations", apiEndpoint: "/api/sessions/cancellation-count" },
  { key: "lapses", label: "Lapsed — no outcome", countKey: "lapses", apiEndpoint: "/api/sessions/lapse-count" },
];

function TriageScreenInner() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState<FilterKey>(
    () => (searchParams.get("filter") as FilterKey) || "bookings",
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      const entries = await Promise.all(
        FILTERS.map(async (f) => {
          try {
            if (f.countKey === "pending") {
              const res = await fetch(f.apiEndpoint, { signal: AbortSignal.timeout(15000) });
              if (!res.ok) return [f.countKey, 0] as const;
              const data = await res.json();
              return [f.countKey, Array.isArray(data) ? data.length : 0] as const;
            }
            const res = await fetch(f.apiEndpoint, { signal: AbortSignal.timeout(15000) });
            if (!res.ok) return [f.countKey, 0] as const;
            const data = await res.json();
            return [f.countKey, data.count ?? 0] as const;
          } catch {
            return [f.countKey, 0] as const;
          }
        }),
      );
      if (!cancelled) {
        setCounts(Object.fromEntries(entries));
        setLoading(false);
      }
    }

    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <HubPageHeader
        title="Schedule triage"
        subtitle={
          total > 0
            ? `${total} item${total === 1 ? "" : "s"} waiting across all queues`
            : "Nothing to sort out — every calendar entry is accounted for."
        }
      />

      {/* Filter chip row */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = counts[f.countKey] ?? 0;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors",
                active === f.key
                  ? "border-rose bg-rose/10 text-rose"
                  : "border-[var(--hub-border)] bg-[var(--hub-card)] text-muted-foreground hover:border-rose/40 hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 rounded-pill px-1.5 text-[11px] font-bold",
                  active === f.key
                    ? "bg-rose text-white"
                    : count > 0
                      ? "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]"
                      : "bg-[var(--hub-canvas)] text-muted-foreground",
                )}
              >
                {loading ? "—" : count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active queue */}
      <div>
        {active === "bookings" && <OutlookBookingsQueue />}
        {active === "duplicates" && <OutlookDuplicatesQueue />}
        {active === "unassigned" && <UnassignedOutlookSessions />}
        {active === "pending-deletions" && <CalendarSyncPendingQueue />}
        {active === "cancellations" && <CancellationReviewWithData />}
        {active === "lapses" && <LapseReviewWithData />}
      </div>
    </div>
  );
}

/** Server-data wrapper for CancellationReview — fetches the same data the
 *  standalone page used to, then hands it to the existing client component. */
function CancellationReviewWithData() {
  const [data, setData] = useState<
    {
      clientId: string;
      clientName: string;
      sessionsPurchased: number | null;
      baselineUsed: number;
      pot: ReturnType<typeof import("@/lib/session-pot").deriveSessionPot>;
      sessions: {
        id: string;
        sessionNumber: number;
        scheduledAt: string | null;
        cancelReason: string | null;
        blockNumber: number;
        focusLabel: string;
      }[];
    }[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sessions/cancellation-data")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setData(d?.clients ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData([]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-surface border border-[var(--hub-border)] bg-[var(--hub-card)] p-10 text-center">
        <p className="text-sm text-muted-foreground">All cancelled sessions have been reviewed.</p>
      </div>
    );
  }
  return <CancellationReview clients={data} />;
}

/** Server-data wrapper for LapseReview. */
function LapseReviewWithData() {
  const [data, setData] = useState<
    {
      clientId: string;
      clientName: string;
      sessions: {
        id: string;
        sessionNumber: number;
        scheduledAt: string | null;
        blockNumber: number;
        workoutLabel: string | null;
      }[];
    }[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sessions/lapse-data")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setData(d?.clients ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData([]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-surface border border-[var(--hub-border)] bg-[var(--hub-card)] p-10 text-center">
        <p className="text-sm text-muted-foreground">No flagged sessions — all clear.</p>
      </div>
    );
  }
  return <LapseReview clients={data} />;
}

export function TriageScreen() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">Loading…</p>}>
      <TriageScreenInner />
    </Suspense>
  );
}
