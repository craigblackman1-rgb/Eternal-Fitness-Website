import { useState } from "react";
import { cn } from "@/lib/utils";

export interface HubSectionProps {
  title: string;
  icon?: React.ReactNode;
  /** Semantic color for the icon badge. */
  color?: "rose" | "teal" | "navy" | "slate" | "amber";
  children: React.ReactNode;
  className?: string;
  /** Collapsible section — content toggles on click. */
  collapsible?: boolean;
  /** Start collapsed. Only applies when collapsible=true. */
  defaultCollapsed?: boolean;
}

const badgeColors: Record<string, { bg: string; text: string }> = {
  rose: { bg: "bg-rose/10", text: "text-rose" },
  teal: { bg: "bg-teal/10", text: "text-teal" },
  navy: { bg: "bg-dark-navy/10", text: "text-dark-navy" },
  slate: { bg: "bg-slate/10", text: "text-slate" },
  amber: { bg: "bg-amber/10", text: "text-amber" },
};

/**
 * Lightweight data section for profile/detail pages. Replaces the
 * cluttered pattern of one-card-per-section. Sections are visually
 * lighter than HubCards — no border, no shadow, just a title + content.
 *
 * Use inside a full-width HubCard or directly in the page layout.
 */
export function HubSection({ title, icon, color = "rose", children, className, collapsible, defaultCollapsed }: HubSectionProps) {
  const c = badgeColors[color];

  if (collapsible) {
    return <CollapsibleSection title={title} icon={icon} color={color} defaultCollapsed={defaultCollapsed}>{children}</CollapsibleSection>;
  }

  return (
    <div className={cn("py-5", className)}>
      <div className="flex items-center gap-2.5 mb-3">
        {icon && (
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", c.bg, c.text)}>
            {icon}
          </div>
        )}
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function CollapsibleSection({ title, icon, color, defaultCollapsed, children }: Omit<HubSectionProps, "className">) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false);
  const c = badgeColors[color!];

  return (
    <div className="py-5 border-b border-[var(--hub-border)] last:border-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2.5 w-full text-left group"
      >
        {icon && (
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", c.bg, c.text)}>
            {icon}
          </div>
        )}
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide flex-1">{title}</h3>
        <svg
          className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", collapsed ? "" : "rotate-180")}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {!collapsed && <div className="mt-3 text-sm">{children}</div>}
    </div>
  );
}
