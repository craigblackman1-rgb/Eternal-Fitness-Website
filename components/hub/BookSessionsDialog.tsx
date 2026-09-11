"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { todayLocalISODate } from "@/lib/schedule-dates";
import { Button } from "@/components/ui/button";

/**
 * CR-EF-199 — BookSessionsDialog: book one session or a repeating weekly
 * pattern against the client's active block from the desktop client record.
 * Matches hub-client-book-sessions.html mockup exactly.
 */

interface SingleBody {
  date: string;
  time: string;
  note?: string;
}

interface PatternBody {
  days: number[];
  time: string;
  times?: Record<number, string>;
  start_date: string;
  until: { kind: "pot" | "expiry" | "count"; count?: number };
}

interface BookedSession {
  id?: string;
  scheduled_at: string;
}

interface SkippedDate {
  date: string;
  reason: string;
}

interface DryRunResult {
  block_id: string;
  block_number: number;
  pot_remaining: number | null;
  expiry: string | null;
  sessions: BookedSession[];
  skipped: SkippedDate[];
  total: number;
  over_pot: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function fmtDayShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function fmtTime(hhmm: string): string {
  return hhmm;
}

export function BookSessionsDialog({
  clientNumber,
  clientName,
  potLine,
  programmeLine,
  onClose,
}: {
  clientNumber: number;
  clientName: string;
  potLine: string;
  programmeLine: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // ── Tab state ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<"one" | "pattern">("pattern");

  // ── One-session state ──────────────────────────────────────────────
  const [oneDate, setOneDate] = useState(todayLocalISODate());
  const [oneTime, setOneTime] = useState("10:00");
  const [oneNote, setOneNote] = useState("");

  // ── Pattern state ──────────────────────────────────────────────────
  const [patDays, setPatDays] = useState<number[]>([2, 4]); // Tue, Thu
  const [patTime, setPatTime] = useState("10:00");
  const [showPerDay, setShowPerDay] = useState(false);
  const [perDayTimes, setPerDayTimes] = useState<Record<number, string>>({});
  const [patStart, setPatStart] = useState(todayLocalISODate());
  const [untilKind, setUntilKind] = useState<"pot" | "expiry" | "count">("pot");
  const [untilCount, setUntilCount] = useState(30);

  // ── Dry run result ─────────────────────────────────────────────────
  const [preview, setPreview] = useState<DryRunResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Debounce dry run calls
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        if (tab === "one") {
          if (!oneDate || !oneTime) {
            setPreview(null);
            return;
          }
          const res = await fetch(`/api/clients/${clientNumber}/book-sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              mode: "single",
              dry_run: true,
              single: { date: oneDate, time: oneTime, note: oneNote || undefined },
            }),
          });
          if (res.ok) {
            const data: DryRunResult = await res.json();
            setPreview(data);
          }
        } else {
          if (!patDays.length || !patTime || !patStart) {
            setPreview(null);
            return;
          }
          const times: Record<number, string> | undefined = showPerDay
            ? Object.fromEntries(patDays.map((d) => [d, perDayTimes[d] ?? patTime]))
            : undefined;

          let until: PatternBody["until"];
          if (untilKind === "pot") {
            until = { kind: "pot" };
          } else if (untilKind === "expiry") {
            until = { kind: "expiry" };
          } else {
            until = { kind: "count", count: untilCount };
          }

          const res = await fetch(`/api/clients/${clientNumber}/book-sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              mode: "pattern",
              dry_run: true,
              pattern: {
                days: patDays,
                time: patTime,
                times,
                start_date: patStart,
                until,
              },
            }),
          });
          if (res.ok) {
            const data: DryRunResult = await res.json();
            setPreview(data);
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("[CR-EF-199] dry run failed:", err);
        }
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    tab, oneDate, oneTime, oneNote,
    patDays, patTime, showPerDay, perDayTimes, patStart, untilKind, untilCount,
    clientNumber,
  ]);

  // ── Confirm handler ────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (tab === "one") {
        const res = await fetch(`/api/clients/${clientNumber}/book-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "single",
            dry_run: false,
            single: { date: oneDate, time: oneTime, note: oneNote || undefined },
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to book session");
        }
        toast.success(`1 session booked · ${fmtDayShort(oneDate + "T00:00:00")} ${fmtTime(oneTime)}`);
      } else {
        const times: Record<number, string> | undefined = showPerDay
          ? Object.fromEntries(patDays.map((d) => [d, perDayTimes[d] ?? patTime]))
          : undefined;

        let until: PatternBody["until"];
        if (untilKind === "pot") {
          until = { kind: "pot" };
        } else if (untilKind === "expiry") {
          until = { kind: "expiry" };
        } else {
          until = { kind: "count", count: untilCount };
        }

        const res = await fetch(`/api/clients/${clientNumber}/book-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "pattern",
            dry_run: false,
            pattern: {
              days: patDays,
              time: patTime,
              times,
              start_date: patStart,
              until,
            },
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to book sessions");
        }
        const result: DryRunResult = await res.json();
        const dayNames = patDays.map((d) => DAY_LABELS[d]).join("/");
        toast.success(
          `${result.total} sessions booked · ${dayNames} ${fmtTime(patTime)} from ${fmtDayShort(patStart + "T00:00:00").replace(/ \d{4}$/, "")}`
        );
      }
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to book sessions");
    } finally {
      setSaving(false);
    }
  }, [
    tab, clientNumber, oneDate, oneTime, oneNote,
    patDays, patTime, showPerDay, perDayTimes, patStart, untilKind, untilCount,
    saving, onClose, router,
  ]);

  // ── Day chip toggle ────────────────────────────────────────────────
  function toggleDay(day: number) {
    setPatDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b);
      return next;
    });
  }

  // ── Preview rows (first 6 + more count) ────────────────────────────
  const previewRows = useMemo(() => {
    if (!preview) return [];
    return preview.sessions.slice(0, 6);
  }, [preview]);

  const previewMoreCount = useMemo(() => {
    if (!preview) return 0;
    return Math.max(0, preview.sessions.length - 6);
  }, [preview]);

  // ── Button label ───────────────────────────────────────────────────
  const confirmLabel = useMemo(() => {
    if (tab === "one") return "Book 1 session";
    const total = preview?.total ?? 0;
    return total > 0 ? `Book ${total} session${total === 1 ? "" : "s"}` : "Book sessions";
  }, [tab, preview]);

  // ── Escape key closes ──────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" data-od-id="book-dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-[600px] mx-4 bg-white border border-[var(--hub-border)] rounded-surface shadow-[0_24px_60px_rgba(16,24,40,.24)] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 bg-white border-b border-[var(--hub-border)] rounded-t-surface shrink-0">
          <div className="w-9 h-9 rounded-nested bg-[var(--status-primary-bg)] text-[var(--status-primary-text)] grid place-items-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[16px] font-bold text-[var(--color-ink)] tracking-tight">
              Book sessions &mdash; {clientName}
            </h2>
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="m-0 text-xs text-[var(--color-muted)]">
                <b className="text-[var(--color-body)] font-semibold">{potLine}</b>
              </p>
              <p className="m-0 text-xs text-[var(--color-muted)]">
                {programmeLine}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-control border border-[var(--hub-border)] bg-white text-[var(--color-muted)] grid place-items-center shrink-0 cursor-pointer hover:bg-[var(--hub-hover)] hover:text-[var(--color-ink)] transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Segment control */}
          <div className="inline-flex items-center gap-0.5 h-9 p-[3px] bg-[var(--hub-canvas)] border border-[var(--hub-border)] rounded-control w-full" role="tablist" aria-label="Booking mode">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "one"}
              onClick={() => setTab("one")}
              className={`flex-1 h-full text-center px-3 border-0 rounded-control-sm bg-transparent font-[inherit] text-[12.5px] font-semibold cursor-pointer transition-colors ${
                tab === "one"
                  ? "bg-white text-[var(--color-ink)] font-bold shadow-sm"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              One session
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "pattern"}
              onClick={() => setTab("pattern")}
              className={`flex-1 h-full text-center px-3 border-0 rounded-control-sm bg-transparent font-[inherit] text-[12.5px] font-semibold cursor-pointer transition-colors ${
                tab === "pattern"
                  ? "bg-white text-[var(--color-ink)] font-bold shadow-sm"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              Weekly pattern
            </button>
          </div>

          {/* ── ONE SESSION TAB ─────────────────────────────────── */}
          {tab === "one" && (
            <div className="mt-4" data-od-id="tab-one">
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--color-muted)]">Date</label>
                  <input
                    type="date"
                    value={oneDate}
                    min={todayLocalISODate()}
                    onChange={(e) => setOneDate(e.target.value)}
                    className="w-full h-[36px] border border-[var(--hub-field-border)] rounded-control px-2.5 font-[inherit] text-[13px] text-[var(--color-ink)] bg-white focus:outline-none focus:border-[var(--color-rose)] focus:shadow-[0_0_0_3px_rgba(193,131,159,.3)]"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--color-muted)]">Time</label>
                  <input
                    type="time"
                    value={oneTime}
                    onChange={(e) => setOneTime(e.target.value)}
                    className="w-full h-[36px] border border-[var(--hub-field-border)] rounded-control px-2.5 font-[inherit] text-[13px] text-[var(--color-ink)] bg-white focus:outline-none focus:border-[var(--color-rose)] focus:shadow-[0_0_0_3px_rgba(193,131,159,.3)]"
                  />
                </div>
              </div>
              <p className="mt-1.5 mb-0 text-xs text-[var(--color-muted)]">60-minute slot</p>

              <div className="mt-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--color-muted)]">
                  Note <span className="font-normal normal-case tracking-normal">&mdash; optional, shows on the booking</span>
                </label>
                <textarea
                  value={oneNote}
                  onChange={(e) => setOneNote(e.target.value)}
                  placeholder="e.g. bringing a new client referral form, wants to review last week&apos;s progress&hellip;"
                  rows={3}
                  className="w-full border border-[var(--hub-field-border)] rounded-control px-2.5 py-2 font-[inherit] text-[13px] text-[var(--color-ink)] bg-white resize-y min-h-[60px] focus:outline-none focus:border-[var(--color-rose)] focus:shadow-[0_0_0_3px_rgba(193,131,159,.3)]"
                />
              </div>
            </div>
          )}

          {/* ── WEEKLY PATTERN TAB ──────────────────────────────── */}
          {tab === "pattern" && (
            <div className="mt-4" data-od-id="tab-pattern">
              {/* Day chips */}
              <label className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--color-muted)] block mb-2">Which days</label>
              <div className="flex gap-[7px] flex-wrap" data-od-id="day-chips">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`min-w-[44px] h-9 px-1 border rounded-control font-[inherit] text-[12.5px] font-bold cursor-pointer transition-colors ${
                      patDays.includes(d)
                        ? "border-[var(--color-rose)] bg-[var(--color-rose)] text-white"
                        : "border-[var(--hub-field-border)] bg-white text-[var(--color-body)] hover:border-[var(--hub-field-hover)]"
                    }`}
                  >
                    {DAY_LABELS[d]}
                  </button>
                ))}
              </div>

              {/* Time */}
              <div className="mt-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--color-muted)]">
                  Time &mdash; same for every selected day
                </label>
                <input
                  type="time"
                  value={patTime}
                  disabled={showPerDay}
                  onChange={(e) => setPatTime(e.target.value)}
                  className="w-full h-[36px] border border-[var(--hub-field-border)] rounded-control px-2.5 font-[inherit] text-[13px] text-[var(--color-ink)] bg-white disabled:bg-[var(--hub-hover)] disabled:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-rose)] focus:shadow-[0_0_0_3px_rgba(193,131,159,.3)]"
                />
              </div>

              {/* Per-day times disclosure */}
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowPerDay((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-control border border-transparent bg-transparent px-2.5 py-1.5 min-h-[32px] font-[inherit] text-[12.5px] font-medium text-[var(--color-muted)] cursor-pointer hover:bg-[var(--hub-hover)] hover:text-[var(--color-ink)] transition-colors"
                >
                  {showPerDay ? "−" : "+"} Different times per day
                </button>
                {showPerDay && (
                  <div className="flex flex-col gap-2 mt-2.5 p-3 border border-dashed border-[var(--hub-field-border)] rounded-nested bg-[var(--hub-hover)]">
                    {patDays.map((d) => (
                      <div key={d} className="flex items-center gap-2.5">
                        <span className="w-[68px] shrink-0 text-[12.5px] font-bold text-[var(--color-ink)]">{DAY_LABELS[d]}</span>
                        <input
                          type="time"
                          value={perDayTimes[d] ?? patTime}
                          onChange={(e) => setPerDayTimes((prev) => ({ ...prev, [d]: e.target.value }))}
                          className="flex-1 h-[32px] border border-[var(--hub-field-border)] rounded-control px-2.5 font-[inherit] text-[13px] text-[var(--color-ink)] bg-white focus:outline-none focus:border-[var(--color-rose)]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start date */}
              <div className="mt-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--color-muted)]">Start date</label>
                <input
                  type="date"
                  value={patStart}
                  min={todayLocalISODate()}
                  onChange={(e) => setPatStart(e.target.value)}
                  className="w-full h-[36px] border border-[var(--hub-field-border)] rounded-control px-2.5 font-[inherit] text-[13px] text-[var(--color-ink)] bg-white focus:outline-none focus:border-[var(--color-rose)] focus:shadow-[0_0_0_3px_rgba(193,131,159,.3)]"
                />
              </div>

              {/* Book until radios */}
              <div className="mt-4">
                <label className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--color-muted)] block mb-2">Book until</label>
                <div className="flex flex-col gap-2" data-od-id="until-radios">
                  <label
                    className={`flex items-start gap-2.5 p-3 border rounded-nested bg-white cursor-pointer transition-colors ${
                      untilKind === "pot" ? "border-[var(--color-rose)] bg-[var(--status-primary-bg)]" : "border-[var(--hub-border)] hover:border-[var(--hub-field-hover)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookUntil"
                      checked={untilKind === "pot"}
                      onChange={() => setUntilKind("pot")}
                      className="mt-0.5 accent-[var(--color-rose)] w-4 h-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="text-[13.5px] font-bold text-[var(--color-ink)]">Pot is used up</span>
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-2.5 p-3 border rounded-nested bg-white cursor-pointer transition-colors ${
                      untilKind === "expiry" ? "border-[var(--color-rose)] bg-[var(--status-primary-bg)]" : "border-[var(--hub-border)] hover:border-[var(--hub-field-hover)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookUntil"
                      checked={untilKind === "expiry"}
                      onChange={() => setUntilKind("expiry")}
                      className="mt-0.5 accent-[var(--color-rose)] w-4 h-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="text-[13.5px] font-bold text-[var(--color-ink)]">Block expiry</span>
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-2.5 p-3 border rounded-nested bg-white cursor-pointer transition-colors ${
                      untilKind === "count" ? "border-[var(--color-rose)] bg-[var(--status-primary-bg)]" : "border-[var(--hub-border)] hover:border-[var(--hub-field-hover)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookUntil"
                      checked={untilKind === "count"}
                      onChange={() => setUntilKind("count")}
                      className="mt-0.5 accent-[var(--color-rose)] w-4 h-4 shrink-0"
                    />
                    <span className="min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-bold text-[var(--color-ink)]">A number of sessions</span>
                      <input
                        type="number"
                        value={untilCount}
                        disabled={untilKind !== "count"}
                        min={1}
                        max={200}
                        onChange={(e) => setUntilCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                        className="w-16 h-[30px] border border-[var(--hub-field-border)] rounded-control-sm px-2 font-[inherit] text-[13px] font-bold text-[var(--color-ink)] bg-white disabled:bg-[var(--hub-hover)] disabled:text-[var(--color-muted)]"
                      />
                    </span>
                  </label>
                </div>
              </div>

              {/* Live preview */}
              {preview && (
                <div className="mt-4 border border-[var(--hub-border)] rounded-nested overflow-hidden bg-white" data-od-id="preview-list">
                  {previewRows.map((row, i) => {
                    const isSkipped = false; // preview.sessions are only booked ones
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] border-b border-[var(--hub-border)] last:border-b-0 ${
                          isSkipped ? "bg-[var(--hub-hover)]" : ""
                        }`}
                      >
                        <span className={`font-bold tabular-nums ${isSkipped ? "text-[var(--color-muted)] line-through decoration-[var(--hub-field-border)]" : "text-[var(--color-ink)]"}`}>
                          {fmtDayShort(row.scheduled_at)} {new Date(row.scheduled_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </span>
                      </div>
                    );
                  })}
                  {/* Skipped rows */}
                  {preview.skipped.slice(0, 6 - previewRows.length).map((sk, i) => (
                    <div
                      key={`sk-${i}`}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] border-b border-[var(--hub-border)] last:border-b-0 bg-[var(--hub-hover)]"
                    >
                      <span className="font-bold tabular-nums text-[var(--color-muted)] line-through decoration-[var(--hub-field-border)]">
                        {fmtDayShort(sk.date + "T00:00:00")} {patTime}
                      </span>
                      <span className="ml-auto text-[var(--status-danger)] font-semibold text-xs">
                        {sk.reason} &mdash; skipped
                      </span>
                    </div>
                  ))}
                  {previewMoreCount > 0 && (
                    <div className="px-3.5 py-2 text-xs text-[var(--color-muted)] italic border-b border-[var(--hub-border)]">
                      +{previewMoreCount} more
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-[12.5px] font-bold text-[var(--color-ink)] bg-[var(--hub-hover)]">
                    <span className="font-medium text-[var(--color-muted)]">Sessions this pattern will book</span>
                    {preview.total}
                  </div>
                </div>
              )}

              {/* Pot warning */}
              {preview && preview.over_pot > 0 && (
                <div className="flex gap-2.5 mt-3 p-3 rounded-nested bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-xs leading-relaxed text-[var(--amber-text)]" data-od-id="pot-warning">
                  <svg className="shrink-0 mt-0.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                  <span>
                    <b className="text-[var(--color-ink)]">Pattern makes {preview.total} sessions but only {preview.pot_remaining} are in the pot</b> &mdash; the last {preview.over_pot} won&apos;t be booked.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footnote */}
          <div className="flex gap-2 mt-4 pt-3.5 border-t border-[var(--hub-border)] text-xs leading-relaxed text-[var(--color-muted)]">
            <svg className="shrink-0 mt-0.5 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>Each booking is pushed to Outlook. The programme assigns the workout on the day, in order &mdash; moving or cancelling a session never skips a workout.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-white border-t border-[var(--hub-border)] rounded-b-surface shrink-0">
          <div className="flex-1" />
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="text-[var(--color-muted)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || (tab === "pattern" && (!patDays.length || !preview))}
            className="bg-rose hover:bg-rose/90 text-white rounded-lg px-5 py-1.5 h-auto text-[13px] font-semibold"
          >
            {saving ? "Booking…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
