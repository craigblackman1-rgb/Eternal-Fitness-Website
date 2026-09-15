"use client";

import Link from "next/link";
import { useDrawerManager } from "./DrawerManager";
import { IconClipboardCheck, IconAlertCircle, IconCheckSquare } from "@/components/icons";
import {
  buildNeedsYouItems,
  type NeedsYouInput,
  type QueueItem,
} from "@/lib/hub/build-needs-you";

export { type NeedsYouInput, type QueueItem, buildNeedsYouItems };

export function NeedsYouQueue(props: NeedsYouInput) {
  const { dueInfo, hasAllDocsSigned, healthFlagsCount } = props;
  const { openDrawer } = useDrawerManager();
  const items = buildNeedsYouItems(props);

  // Quiet row at the bottom — everything is fine
  const hasIssues = items.length > 0;
  const quietText = (() => {
    const parts: string[] = [];
    if (dueInfo.nextDueDate) {
      const dueDate = new Date(dueInfo.nextDueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      parts.push(`next training update due ${dueDate}`);
    }
    if (hasAllDocsSigned) parts.push("documents are all signed");
    if (healthFlagsCount === 0) parts.push("health record is up to date");
    if (parts.length === 0) return null;
    return `Nothing else outstanding. ${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)}${parts.length > 1 ? ", " + parts.slice(1).join(", and ") : ""}.`;
  })();

  const dotClasses: Record<string, string> = {
    warn: "bg-[var(--status-warning)]",
    due: "bg-rose",
    ok: "bg-[var(--status-success)]",
    muted: "bg-[var(--color-muted)]",
  };

  return (
    <div className="px-4 pb-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 py-2 px-3 rounded-nested border border-transparent transition-colors duration-100 hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)]"
        >
          <span className={`w-[7px] h-[7px] rounded-pill shrink-0 ${dotClasses[item.dot]}`} />
          <span className="min-w-0 flex-1 text-[13.5px] text-[var(--color-ink)]">
            <b className="font-semibold">{item.headline}</b>
            {item.subline && (
              <span className="block text-xs text-[var(--color-muted)] mt-px">{item.subline}</span>
            )}
          </span>
          {item.actionLabel && (
            <span className="shrink-0">
              {item.onAction ? (
                <button
                  onClick={item.onAction}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] font-[inherit] text-xs font-semibold cursor-pointer transition-colors"
                >
                  {item.actionLabel}
                </button>
              ) : item.actionHref ? (
                <Link
                  href={item.actionHref}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] font-[inherit] text-xs font-semibold cursor-pointer transition-colors no-underline"
                >
                  {item.actionLabel}
                </Link>
              ) : (
                <button
                  onClick={item.actionDrawerId ? (e) => openDrawer(item.actionDrawerId!, e.currentTarget) : undefined}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] font-[inherit] text-xs font-semibold cursor-pointer transition-colors"
                >
                  {item.actionLabel}
                </button>
              )}
            </span>
          )}
        </div>
      ))}

      {!hasIssues && quietText && (
        <div className="flex items-center gap-2.5 py-2 px-3 text-[13px] text-[var(--color-muted)]">
          <span className="w-[7px] h-[7px] rounded-pill bg-[var(--status-success)]" />
          <span>{quietText}</span>
        </div>
      )}
    </div>
  );
}
