import Link from "next/link";
import { cn } from "@/lib/utils";

interface HubQuickAction {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface HubQuickActionsProps {
  actions: HubQuickAction[];
  className?: string;
}

/**
 * Quick actions list — consistent icon + label pattern for sidebar
 * and inline action panels.
 */
export function HubQuickActions({ actions, className }: HubQuickActionsProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="rounded-lg px-2.5 py-2 hover:bg-[var(--hub-hover)] text-sm font-medium flex items-center gap-2.5 transition-colors"
        >
          <span className="w-4 h-4 shrink-0 text-muted-foreground">{action.icon}</span>
          {action.label}
        </Link>
      ))}
    </div>
  );
}
