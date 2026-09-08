"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconUserPlus } from "@/components/icons";
import { formatFrequencyShort, type Frequency } from "@/types";

/* ── S6 Clients screen ────────────────────────────────────────────────────
   Two sections and nothing else: the queue of what needs Esther today, then
   the plain alphabetical roster. No compliance column, no status filters —
   the reason a client needs attention is written on their row in words. */

export interface ClientRow {
  id: string;
  clientNumber: number;
  name: string;
  archived: boolean;
  frequency: Frequency | null;
  sessionsPerWeek: number | null;
  goal: string | null;
  conditionCount: number;
  reason: string | null;
  hot: boolean;
  dot: "due" | "warn" | "nil";
  /** null = no package on file (not set up / ongoing). */
  sessionsRemaining: number | null;
  sessionsPurchased: number | null;
}

export interface QueueItem {
  id: string;
  dot: "due" | "warn";
  headline: string;
  subline?: string;
  actionLabel: string;
  href: string;
}

const GOAL_LABELS: Record<string, string> = {
  strength: "Strength",
  mobility: "Mobility",
  weight_loss: "Weight Loss",
  general_fitness: "General Fitness",
  rehab: "Rehab",
  endurance: "Endurance",
};

function goalLabel(goal: string | null): string | null {
  if (!goal) return null;
  return GOAL_LABELS[goal] ?? goal.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function facts(r: ClientRow): string {
  const parts: string[] = [];
  const freq = formatFrequencyShort(
    r.frequency ?? (r.sessionsPerWeek ? { unit: "week", per_unit: r.sessionsPerWeek } : null),
  );
  if (freq && freq !== "—") parts.push(freq);
  const g = goalLabel(r.goal);
  if (g) parts.push(g);
  // Omitted entirely at zero rather than printing "0 conditions".
  if (r.conditionCount > 0) parts.push(`${r.conditionCount} condition${r.conditionCount === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

const DOT: Record<string, string> = {
  due: "bg-rose",
  warn: "bg-[var(--status-warning)]",
  nil: "bg-transparent",
};

export function ClientsScreen({
  rows,
  queue,
  settledNames,
  draftBlockClientIds,
  activeFilter,
}: {
  rows: ClientRow[];
  queue: QueueItem[];
  settledNames: string[];
  draftBlockClientIds?: Set<number>;
  activeFilter?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [filter, setFilter] = useState<string | null>(activeFilter ?? null);

  // Sync URL filter param on mount
  useEffect(() => {
    if (activeFilter) setFilter(activeFilter);
  }, [activeFilter]);

  const setFilterParam = (value: string | null) => {
    setFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("filter", value);
    } else {
      params.delete("filter");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const archivedCount = rows.filter((r) => r.archived).length;
  const draftCount = draftBlockClientIds?.size ?? 0;
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.archived && !showArchived) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (filter === "draft-block" && draftBlockClientIds && !draftBlockClientIds.has(r.clientNumber)) return false;
      return true;
    });
  }, [rows, search, showArchived, filter, draftBlockClientIds]);

  const needCount = queue.length;

  return (
    <div className="w-full">
      {/* Header — no page-level primary button; every action belongs to a row. */}
      <div className="flex items-baseline gap-2.5 flex-wrap mb-3.5">
        <h1 className="m-0 text-[25px] font-bold tracking-tight text-[var(--color-ink)]">Clients</h1>
        {needCount > 0 && (
          <span className="inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]">
            {needCount} need{needCount === 1 ? "s" : ""} you
          </span>
        )}
        <span className="text-[13px] text-[var(--color-body)]">
          {rows.filter((r) => !r.archived).length} on the books
        </span>
      </div>

      {/* ── Filter chips ── */}
      {draftCount > 0 && (
        <div className="flex gap-1.5 mb-3.5">
          <button
            type="button"
            onClick={() => setFilterParam(filter === "draft-block" ? null : "draft-block")}
            className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-[12px] font-semibold transition-colors ${
              filter === "draft-block"
                ? "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]"
                : "bg-white text-[var(--color-muted)] border-[var(--hub-border)] hover:border-[var(--color-ink)]/30"
            }`}
          >
            <span className={`w-[6px] h-[6px] rounded-pill ${filter === "draft-block" ? "bg-[var(--status-warning)]" : "bg-[var(--color-muted)]/40"}`} />
            {draftCount} block{draftCount === 1 ? "" : "s"} waiting for approval
          </button>
        </div>
      )}

      {/* ── Needs you today ── */}
      <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden mb-3.5">
        <div className="flex items-center gap-2.5 py-2.5 px-4 border-b border-[var(--hub-border)]">
          <h2 className="m-0 text-[15px] font-bold text-[var(--color-ink)] tracking-tight">Needs you today</h2>
          <span className="text-xs text-[var(--color-muted)]">
            {needCount > 0 ? `${needCount} thing${needCount === 1 ? "" : "s"} · in the order you'd work them` : "All clear"}
          </span>
        </div>
        <div className="px-4 pb-3">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 px-3 rounded-nested border border-transparent transition-colors duration-100 hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)]"
            >
              <span className={`w-[7px] h-[7px] rounded-pill shrink-0 ${DOT[item.dot]}`} />
              <span className="min-w-0 flex-1 text-[13.5px] text-[var(--color-ink)]">
                <b className="font-semibold">{item.headline}</b>
                {item.subline && (
                  <span className="block text-xs text-[var(--color-muted)] mt-px">{item.subline}</span>
                )}
              </span>
              <Link
                href={item.href}
                className="shrink-0 inline-flex items-center justify-center rounded-lg border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] text-xs font-semibold no-underline transition-colors"
              >
                {item.actionLabel}
              </Link>
            </div>
          ))}

          {queue.length > 0 && settledNames.length > 0 && (
            <>
              <hr className="h-px bg-[var(--hub-border)] border-0 my-3" />
              <div className="flex items-center gap-2.5 py-2 px-3 text-[13px] text-[var(--color-muted)]">
                <span className="w-[7px] h-[7px] rounded-pill bg-[var(--status-success)] shrink-0" />
                <span>
                  The other {settledNames.length} need nothing from you today
                  {settledNames.length <= 6 ? ` — ${settledNames.join(", ")}` : ""}.
                </span>
              </div>
            </>
          )}

          {queue.length === 0 && (
            <div className="flex items-center gap-2.5 py-2 px-3 text-[13px] text-[var(--color-muted)]">
              <span className="w-[7px] h-[7px] rounded-pill bg-[var(--status-success)] shrink-0" />
              <span>Nothing needs you today.</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Everyone ── */}
      <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden">
        {/* §5 toolbar — above the data, inside the card */}
        <div className="flex items-center gap-2 py-3 px-4 border-b border-[var(--hub-border)]">
          <h2 className="m-0 text-[15px] font-bold text-[var(--color-ink)] tracking-tight">Everyone</h2>
          <span className="text-xs text-[var(--color-muted-text)]">{visible.length} in the list</span>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter this list by name"
              aria-label="Filter this list by name"
              className="h-9 flex-1 min-w-[200px] max-w-[360px] rounded-[var(--r-control)] border border-[var(--hub-field-border)] px-3 text-[13px] bg-white"
            />
            <Link
              href="/hub/clients/new"
              className="btn btn-outline btn-sm"
            >
              <IconUserPlus className="w-4 h-4" /> Add a client
            </Link>
          </div>
        </div>

        {/* §6 table contract — fixed layout, one auto column, rest content-sized */}
        <div className="tbl-wrap">
          <table className="tbl">
            <colgroup>
              <col className="col-id" />
              <col className="col-train" />
              <col className="col-left" />
              <col className="col-needs" />
            </colgroup>
            <thead>
              <tr>
                <th>Client</th>
                <th>How they train</th>
                <th className="num">Sessions left</th>
                <th>Needs</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  className={`row-link ${r.archived ? "opacity-60" : ""}`}
                  tabIndex={0}
                  onClick={() => router.push(`/hub/clients/${r.clientNumber}`)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/hub/clients/${r.clientNumber}`); } }}
                >
                  <td>
                    <div className="cl-id">
                      <span className={`w-[7px] h-[7px] rounded-pill shrink-0 ${DOT[r.dot]}`} />
                      <span className="cl-nm">
                        {r.name}
                        {r.archived && <small>archived</small>}
                      </span>
                    </div>
                  </td>
                  <td className="dim trunc">{facts(r)}</td>
                  {r.sessionsPurchased != null ? (
                    <td className={`num${r.sessionsRemaining != null && r.sessionsRemaining <= 2 ? " low" : ""}`}>
                      <b>{r.sessionsRemaining}</b> <small>of {r.sessionsPurchased}</small>
                    </td>
                  ) : (
                    <td className="num dim">Not set up</td>
                  )}
                  <td className={`trunc${r.hot ? " font-semibold text-[var(--color-ink)]" : ""}`}>
                    {r.reason ?? ""}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-[13px] text-[var(--color-muted-text)]">
                    {search.trim() ? "No client matches that name." : "No clients yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {archivedCount > 0 && (
          <div className="border-t border-[var(--hub-border)] px-4 py-2">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="text-xs font-semibold text-[var(--color-rose)] bg-transparent border-0 p-0 cursor-pointer hover:underline underline-offset-2"
            >
              {showArchived
                ? `Hide the ${archivedCount} archived record${archivedCount === 1 ? "" : "s"}`
                : `Show the ${archivedCount} archived record${archivedCount === 1 ? "" : "s"}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
