"use client";

import Link from "next/link";
import { useState } from "react";
import { IconChevronLeft, IconMail } from "@/components/icons";
import { TokenPill } from "@/components/hub/StatusBadge";
import { pronouns } from "@/lib/pronouns";
import type { SentUpdate } from "@/types";

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || name;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface CommsComposerClientProps {
  clientNumber: number;
  clientName: string;
  gender: string | null;
  sessionsPurchased: number | null;
  sessionsUsed: number | null;
  updates: SentUpdate[];
}

export function CommsComposerClient({
  clientNumber,
  clientName,
  gender,
  sessionsPurchased,
  sessionsUsed,
  updates,
}: CommsComposerClientProps) {
  const [showAll, setShowAll] = useState(false);
  const name = firstName(clientName);
  const p = pronouns(gender);

  const sentUpdates = updates
    .filter((u) => u.status === "sent" && u.sent_at)
    .sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime());

  const displayedUpdates = showAll ? sentUpdates : sentUpdates.slice(0, 10);

  const sessionsRemaining =
    sessionsPurchased != null && sessionsUsed != null
      ? sessionsPurchased - sessionsUsed
      : null;

  return (
    <div className="space-y-4 max-w-[1100px] mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="w-[48px] h-[48px] rounded-pill bg-[var(--status-primary-bg)] text-[var(--status-primary-text)] grid place-items-center text-base font-bold shrink-0">
          {clientName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-bold tracking-[-.015em] text-[var(--color-ink)] m-0">
              Write to {name}
            </h1>
            {sessionsRemaining != null && (
              <span className="inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold bg-[var(--status-primary-bg)] text-[var(--status-primary-text)] border-[var(--status-primary-border)]">
                {sessionsRemaining} of {sessionsPurchased} sessions left
              </span>
            )}
          </div>
          <p className="text-[13.5px] text-muted-foreground mt-0.5 m-0">
            {clientName} · updates, check-ins and reviews — one place
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href={`/hub/clients/${clientNumber}`}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] text-[13px] font-semibold text-foreground hover:bg-[var(--hub-hover)] transition-colors no-underline"
          >
            Back to the record
          </Link>
        </div>
      </div>

      {/* How do you want to write it? */}
      <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-muted-foreground m-0">
        How do you want to write it?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* QUICK */}
        <div className="flex flex-col bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden">
          <div className="flex-1 p-4">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[var(--status-primary-text)] m-0 mb-2">Quick</p>
            <h2 className="text-[15px] font-bold text-[var(--color-ink)] m-0 mb-1.5">Write or paste an update</h2>
            <p className="text-[12.5px] text-muted-foreground m-0 mb-2.5">
              Free text — type it or paste it in. It lands in the house-styled email wrapper, tracked like every other update.
            </p>
            <p className="text-[12.5px] text-muted-foreground m-0">
              <span className="font-bold text-[var(--color-ink)]">Best when</span> you already know what you want to say.
            </p>
          </div>
          <div className="border-t border-[var(--hub-border)] p-3">
            <Link
              href={`/hub/clients/${clientNumber}/updates/new`}
              className="flex items-center justify-center w-full h-9 rounded-lg bg-rose text-white text-[13px] font-semibold hover:bg-[color-mix(in_oklch,var(--rose)_82%,var(--ink))] transition-colors no-underline"
            >
              Start writing
            </Link>
          </div>
        </div>

        {/* FROM A TEMPLATE */}
        <div className="flex flex-col bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden">
          <div className="flex-1 p-4">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[var(--teal-text)] m-0 mb-2">From a template</p>
            <h2 className="text-[15px] font-bold text-[var(--color-ink)] m-0 mb-1.5">Start from a template</h2>
            <p className="text-[12.5px] text-muted-foreground m-0 mb-2.5">
              Progress summary, four-week recap, renewal note — pre-filled from {name}&apos;s real numbers, edited before anything sends.
            </p>
            <p className="text-[12.5px] text-muted-foreground m-0">
              <span className="font-bold text-[var(--color-ink)]">Best when</span> it is a regular touchpoint.
            </p>
          </div>
          <div className="border-t border-[var(--hub-border)] p-3">
            <Link
              href={`/hub/clients/${clientNumber}/updates/new?template=picker`}
              className="flex items-center justify-center w-full h-9 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] text-[13px] font-semibold text-foreground hover:bg-[var(--hub-hover)] transition-colors no-underline"
            >
              Choose a template
            </Link>
          </div>
        </div>

        {/* REVIEW FIRST */}
        <div className="flex flex-col bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden">
          <div className="flex-1 p-4">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[var(--amber-text)] m-0 mb-2">Review first</p>
            <h2 className="text-[15px] font-bold text-[var(--color-ink)] m-0 mb-1.5">Run a check-in, then send it</h2>
            <p className="text-[12.5px] text-muted-foreground m-0 mb-2.5">
              The guided review — recent sessions, PBs, position, health, a decision — ends with the update drafted for you from what you recorded.
            </p>
            <p className="text-[12.5px] text-muted-foreground m-0">
              <span className="font-bold text-[var(--color-ink)]">Best when</span> it is time to take stock, not just report.
            </p>
          </div>
          <div className="border-t border-[var(--hub-border)] p-3">
            <Link
              href={`/hub/clients/${clientNumber}/review`}
              className="flex items-center justify-center w-full h-9 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] text-[13px] font-semibold text-foreground hover:bg-[var(--hub-hover)] transition-colors no-underline"
            >
              Start the check-in
            </Link>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm p-4">
        <div className="flex gap-6 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-muted-foreground m-0 mb-1">1 · Draft</p>
            <p className="text-[12.5px] text-muted-foreground m-0">Written, pasted, templated, or produced by the check-in.</p>
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-muted-foreground m-0 mb-1">2 · Preview</p>
            <p className="text-[12.5px] text-muted-foreground m-0">Exactly what {name} receive{p.verb === "has" ? "s" : ""}, in the house wrapper. Nothing sends until you say so.</p>
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-muted-foreground m-0 mb-1">3 · Send &amp; track</p>
            <p className="text-[12.5px] text-muted-foreground m-0">Sent, then opened/clicked tracked — visible below and on the Comms drawer.</p>
          </div>
        </div>
      </div>

      {/* Every update sent */}
      <div className="bg-[var(--hub-card)] border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[var(--hub-border)]">
          <h2 className="text-[15px] font-bold text-[var(--color-ink)] m-0 flex-1 min-w-0">Every update sent</h2>
          <span className="text-[12.5px] text-muted-foreground whitespace-nowrap">Newest first · opens and clicks shown once Resend reports them</span>
        </div>
        {displayedUpdates.length > 0 ? (
          <div>
            {displayedUpdates.map((u) => {
              const sentDate = formatShortDate(u.sent_at!);
              let trackingLine: string;
              let badgeLabel: string;
              let badgeToken: "success" | "neutral" = "neutral";

              if (u.opened_at) {
                const openedDate = new Date(u.opened_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                const openedTime = new Date(u.opened_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
                trackingLine = `Opened ${openedDate}, ${openedTime}`;
                if (u.open_count > 1) trackingLine += ` ×${u.open_count}`;
                badgeLabel = "Opened";
                badgeToken = "success";
              } else if (u.emailed) {
                trackingLine = "Not opened yet";
                badgeLabel = "Sent";
                badgeToken = "neutral";
              } else {
                trackingLine = "No open tracking";
                badgeLabel = "Logged";
                badgeToken = "neutral";
              }

              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--hub-border)] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--color-ink)] m-0 truncate">{u.subject}</p>
                    <p className="text-[12.5px] text-muted-foreground m-0 mt-0.5">
                      Sent {sentDate} · {trackingLine}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <TokenPill token={badgeToken} label={badgeLabel} className="text-[11.5px]" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-6">
            <div className="w-10 h-10 rounded-pill bg-[var(--hub-hover)] text-muted-foreground grid place-items-center mx-auto mb-3">
              <IconMail className="w-5 h-5" />
            </div>
            <p className="text-[15px] font-bold text-[var(--color-ink)] m-0 mb-1">No updates yet</p>
            <p className="text-[13px] text-muted-foreground m-0 mb-3.5 max-w-[380px] mx-auto">
              Send your first update using one of the options above.
            </p>
          </div>
        )}
        {sentUpdates.length > 10 && !showAll && (
          <div className="border-t border-[var(--hub-border)] px-5 py-2.5">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-[12.5px] font-semibold text-[var(--status-primary-text)] hover:underline underline-offset-2 bg-transparent border-0 p-0 font-[inherit] cursor-pointer"
            >
              Show all {sentUpdates.length} updates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
