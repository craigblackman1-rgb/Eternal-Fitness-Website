"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ensureUids } from "@/lib/exercise-ref";
import type { SessionVersion } from "@/types";

/**
 * Mobile swap chooser — Phase 3 (pwa-parity u5).
 *
 * A bottom-sheet list that lets the trainer swap the current session's
 * workout. Two routes, mirroring the desktop SessionChooser:
 * 1. Programme queue — next slot from the programme
 * 2. Workout template — pick from the shared library
 *
 * Both PATCH /api/sessions/[id] with the appropriate payload.
 */

interface TemplateSummary {
  id: string;
  name: string;
  equipment: string[];
  position: string[];
  estimatedMinutes: number;
}

interface SwapChooserProps {
  sessionId: string;
  clientNumber: number | null;
  currentWorkoutName: string;
  hasProgram: boolean;
  onClose: () => void;
  /** Called after a successful swap so the parent can refresh */
  onSwapped: () => void;
}

export function SwapChooser({
  sessionId,
  clientNumber,
  currentWorkoutName,
  hasProgram,
  onClose,
  onSwapped,
}: SwapChooserProps) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clientNumber == null || templatesLoading || templates.length > 0) return;
    setTemplatesLoading(true);
    fetch(`/api/clients/${clientNumber}/add-workout`)
      .then((r) => (r.ok ? r.json() : null))
      .then((ctx) => {
        if (ctx?.matchedTemplates) setTemplates(ctx.matchedTemplates);
      })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, [clientNumber, templates.length, templatesLoading]);

  const filteredTemplates = templateQuery.trim()
    ? templates.filter((t) => t.name.toLowerCase().includes(templateQuery.toLowerCase()))
    : templates;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  async function handleSwapProgramme() {
    if (!hasProgram || clientNumber == null) return;
    setSaving(true);
    try {
      const stateRes = await fetch(`/api/clients/${clientNumber}/program-state`);
      if (!stateRes.ok) {
        const errData = await stateRes.json().catch(() => null);
        throw new Error(errData?.error || "Could not load programme state");
      }
      const state: { program: { id: string }; nextSlot: { id: string } | null } = await stateRes.json();
      if (!state.nextSlot) {
        throw new Error("Programme queue is exhausted — no next slot available");
      }
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: state.program.id,
          program_slot_id: state.nextSlot.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to swap workout");
      }
      toast.success("Workout swapped to next in programme");
      onSwapped();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSwapTemplate() {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const tplRes = await fetch("/api/workout-templates");
      if (!tplRes.ok) throw new Error("Could not load template data");
      const tplList: { id: string; name: string; data: SessionVersion }[] = await tplRes.json();
      const tpl = tplList.find((t) => t.id === selectedTemplateId);
      if (!tpl) throw new Error("Template not found");

      const versions: Record<string, SessionVersion> = {};
      const buildVersion = (src: SessionVersion): SessionVersion => ({
        warm_up: ensureUids(src.warm_up ?? []),
        main_block: ensureUids(src.main_block ?? []),
        cooldown: ensureUids(src.cooldown ?? []),
      });
      versions.studio = buildVersion(tpl.data);
      versions.home = buildVersion(tpl.data);

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { versions, focus_label: tpl.name },
          source_focus_label: tpl.name,
          source_archetype: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to assign template");
      }
      fetch(`/api/workout-templates/${selectedTemplateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment_usage: true }),
      }).catch(() => {});

      toast.success(`Swapped to "${tpl.name}"`);
      onSwapped();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="sheet-overlay open" onClick={onClose} />
      <div className="swap-sheet" role="dialog" aria-modal="true" aria-labelledby="swapSheetTitle">
        <div className="sh-grab" />
        <div className="sh-h">
          <span className="sh-t" id="swapSheetTitle">Swap workout</span>
          <button className="sh-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="sh-s">
          Currently: {currentWorkoutName}
        </div>
        <div className="swap-body">
          {/* Programme queue option */}
          {hasProgram && (
            <button
              type="button"
              className="swap-option"
              onClick={handleSwapProgramme}
              disabled={saving}
            >
              <div className="swap-option-ic" style={{ background: "var(--s-primary-bg)", color: "var(--rose)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div className="swap-option-body">
                <div className="swap-option-t">From programme</div>
                <div className="swap-option-s">Swap to the next workout in the queue</div>
              </div>
              <span className="swap-option-chev">›</span>
            </button>
          )}

          {/* Template picker */}
          <div className="swap-section">
            <div className="swap-section-t">From template</div>
            {templatesLoading && (
              <div className="swap-loading">Loading templates…</div>
            )}
            {!templatesLoading && templates.length === 0 && (
              <div className="swap-empty">No templates available for this client.</div>
            )}
            {!templatesLoading && templates.length > 0 && (
              <>
                <input
                  type="search"
                  placeholder="Search templates…"
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  className="swap-search"
                />
                <div className="swap-list">
                  {filteredTemplates.length === 0 && (
                    <div className="swap-empty">No matches.</div>
                  )}
                  {filteredTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`swap-item${selectedTemplateId === t.id ? " selected" : ""}`}
                      onClick={() => setSelectedTemplateId(t.id === selectedTemplateId ? null : t.id)}
                    >
                      <div className="swap-item-t">{t.name}</div>
                      <div className="swap-item-s">
                        {t.position[0] || "—"} · est. {t.estimatedMinutes} min
                      </div>
                    </button>
                  ))}
                </div>
                {selectedTemplate && (
                  <button
                    type="button"
                    className="btn btn-primary swap-confirm"
                    onClick={handleSwapTemplate}
                    disabled={saving}
                  >
                    {saving ? "Swapping…" : `Swap to "${selectedTemplate.name}"`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
