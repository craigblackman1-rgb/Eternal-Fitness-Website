"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { sessionWorkoutName } from "@/lib/session-display";

/**
 * Mobile Move + Cancel sheet — Phase 4 (pwa-parity u5).
 *
 * A bottom-sheet dual-purpose panel mirroring the desktop SessionMoveDialog:
 * - Move: fetches candidate slots, PATCHes scheduled_at
 * - Cancel: charged/free choice, PATCHes cancelled_at + charged_free
 *
 * Both actions confirm before writing.
 */

interface SlotCandidate {
  date: string;
  time: string;
  label: string;
  fullDateTime: string;
  isFree: boolean;
  note: string;
}

interface SessionData {
  id: string;
  scheduled_at: string | null;
  block_id: string;
  session_number: number;
  data?: {
    focus_label?: string;
    versions?: {
      studio?: { warm_up?: unknown[]; main_block?: unknown[]; cooldown?: unknown[] };
      home?: { warm_up?: unknown[]; main_block?: unknown[]; cooldown?: unknown[] };
    };
  };
  archetype?: string | null;
  week?: number | null;
  phase?: string | null;
}

interface MoveCancelSheetProps {
  session: SessionData;
  clientName: string;
  clientNumber: number | null;
  onClose: () => void;
  onMoved: () => void;
  onCancelled: () => void;
}

const CANCEL_REASONS = [
  "Illness",
  "Client request",
  "Esther unavailable",
  "Other",
] as const;

function fmtDayShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function MoveCancelSheet({
  session,
  clientName,
  clientNumber,
  onClose,
  onMoved,
  onCancelled,
}: MoveCancelSheetProps) {
  const [route, setRoute] = useState<"move" | "cancel">("move");

  // Move state
  const [slots, setSlots] = useState<SlotCandidate[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Cancel state
  const [chargedFree, setChargedFree] = useState<"charged" | "free" | null>(null);
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [potData, setPotData] = useState<{ remaining: number | null; purchased: number | null } | null>(null);

  const workoutName = sessionWorkoutName(session, `Session ${session.session_number}`);

  // Fetch pot data on mount for cancel consequence preview
  useEffect(() => {
    if (clientNumber == null) return;
    fetch(`/api/clients/${clientNumber}/pot-ledger`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.consumption) {
          setPotData({
            remaining: data.consumption.remaining ?? null,
            purchased: data.consumption.purchased ?? null,
          });
        }
      })
      .catch(() => {});
  }, [clientNumber]);

  // Fetch candidate slots on mount (move mode)
  useEffect(() => {
    if (route !== "move") return;
    const controller = new AbortController();

    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const from = session.scheduled_at
          ? new Date(session.scheduled_at).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        const res = await fetch(
          `/api/availability/slots?from=${from}&weeks=3`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to load availability");
        const data = await res.json();
        const candidates: SlotCandidate[] = [];
        const bookedSet = new Set<string>();

        for (const week of data.weeks ?? []) {
          for (const day of week.days ?? []) {
            if (day.state !== "open") continue;
            for (const slot of day.slots ?? []) {
              const iso = slot.startUtc;
              const dt = new Date(iso);
              const label = dt.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const time = dt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              candidates.push({
                date: day.date,
                time: slot.startLocal,
                label,
                fullDateTime: iso,
                isFree: !bookedSet.has(`${day.date} ${slot.startLocal}`),
                note: `${time} · Esther's available slot`,
              });
            }
          }
        }
        setSlots(candidates);
        const firstFree = candidates.find((s) => s.isFree);
        if (firstFree) setSelectedSlot(firstFree.fullDateTime);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Slot fetch failed:", err);
        }
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
    return () => controller.abort();
  }, [route, session.scheduled_at]);

  const handleMove = useCallback(async () => {
    if (!selectedSlot) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: selectedSlot }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to move session");
      }
      toast.success(`Session moved to ${fmtDayShort(selectedSlot)}`);
      onMoved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move session");
    } finally {
      setSaving(false);
    }
  }, [selectedSlot, session.id, onMoved]);

  const handleCancel = useCallback(async () => {
    if (!chargedFree) return;
    setSaving(true);
    try {
      const reason = cancelReason === "Other" && otherReason ? otherReason : cancelReason;
      const body: Record<string, unknown> = {
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
      };
      if (chargedFree === "free") {
        body.charged_free = "free";
      }
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel session");
      }
      toast.success(
        chargedFree === "charged"
          ? "Cancelled — charged to balance"
          : "Cancelled free of charge",
      );
      onCancelled();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel session");
    } finally {
      setSaving(false);
    }
  }, [session.id, chargedFree, cancelReason, otherReason, onCancelled]);

  const sessionsRemaining = potData?.remaining ?? null;
  const selectedSlotData = slots.find((s) => s.fullDateTime === selectedSlot);

  return (
    <>
      <div className="sheet-overlay open" onClick={onClose} />
      <div className="mc-sheet" role="dialog" aria-modal="true" aria-labelledby="mcSheetTitle">
        <div className="sh-grab" />
        <div className="sh-h">
          <span className="sh-t" id="mcSheetTitle">Move or cancel</span>
          <button className="sh-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="sh-s">
          {clientName} · {workoutName}
        </div>

        {/* Route toggle */}
        <div className="mc-routes">
          <button
            type="button"
            className={`mc-route${route === "move" ? " on" : ""}`}
            onClick={() => setRoute("move")}
          >
            <span className="mc-route-t">Move it</span>
            <span className="mc-route-s">Reschedule</span>
          </button>
          <button
            type="button"
            className={`mc-route${route === "cancel" ? " on" : ""}`}
            onClick={() => setRoute("cancel")}
          >
            <span className="mc-route-t">Cancel it</span>
            <span className="mc-route-s">Remove booking</span>
          </button>
        </div>

        <div className="mc-body">
          {/* Move panel */}
          {route === "move" && (
            <div className="mc-panel">
              {slotsLoading ? (
                <div className="mc-loading">Loading available slots…</div>
              ) : slots.length === 0 ? (
                <div className="mc-empty">No available slots found in the next 3 weeks.</div>
              ) : (
                <>
                  <div className="mc-label">New date and time</div>
                  <div className="mc-slots">
                    {slots.slice(0, 12).map((slot) => {
                      const isSelected = slot.fullDateTime === selectedSlot;
                      return (
                        <button
                          key={slot.fullDateTime}
                          type="button"
                          className={`mc-slot${isSelected ? " selected" : ""}${!slot.isFree ? " occupied" : ""}`}
                          onClick={() => setSelectedSlot(slot.fullDateTime)}
                        >
                          <div className="mc-slot-label">{slot.label}</div>
                          <div className="mc-slot-time">{slot.time}</div>
                          {!slot.isFree && <div className="mc-slot-note">Occupied</div>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSlotData && (
                    <div className={`mc-slot-info ${selectedSlotData.isFree ? "free" : "busy"}`}>
                      <span className="mc-dot" />
                      {selectedSlotData.label}, {selectedSlotData.time} is{" "}
                      {selectedSlotData.isFree ? "free" : "occupied"}
                    </div>
                  )}
                  <div className="mc-reassurance">
                    Programme unaffected — {workoutName} stays as built. Only the date changes.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cancel panel */}
          {route === "cancel" && (
            <div className="mc-panel">
              <div className="mc-label">How should this be handled?</div>
              <div className="mc-cancel-opts">
                <button
                  type="button"
                  className={`mc-cancel-opt${chargedFree === "charged" ? " on" : ""}`}
                  onClick={() => setChargedFree("charged")}
                >
                  <span className="mc-cancel-t">Charge to balance</span>
                  <span className="mc-cancel-s">Uses one paid session · count drops by 1</span>
                </button>
                <button
                  type="button"
                  className={`mc-cancel-opt${chargedFree === "free" ? " on" : ""}`}
                  onClick={() => setChargedFree("free")}
                >
                  <span className="mc-cancel-t">Free cancellation</span>
                  <span className="mc-cancel-s">No session used · slot released</span>
                </button>
              </div>
              {chargedFree && (
                <div className={`mc-consequence ${chargedFree === "charged" ? "warn" : "ok"}`}>
                  {chargedFree === "charged"
                    ? `${sessionsRemaining ?? "?"} remaining → ${Math.max(0, (sessionsRemaining ?? 1) - 1)} remaining`
                    : `${sessionsRemaining ?? "?"} remaining → ${sessionsRemaining ?? "?"} (no change)`}
                </div>
              )}
              <div className="mc-label" style={{ marginTop: 12 }}>Reason</div>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mc-select"
              >
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {cancelReason === "Other" && (
                <input
                  type="text"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Specify reason"
                  className="mc-input"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mc-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            Back
          </button>
          {route === "move" ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMove}
              disabled={saving || !selectedSlot}
            >
              {saving ? "Saving…" : selectedSlotData ? `Move to ${selectedSlotData.label}` : "Select a slot"}
            </button>
          ) : (
            <button
              type="button"
              className={`btn ${chargedFree === "charged" ? "btn-danger" : "btn-primary"}`}
              onClick={handleCancel}
              disabled={saving || !chargedFree}
            >
              {saving ? "Saving…" : chargedFree === "charged" ? "Cancel and charge" : "Cancel free"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
