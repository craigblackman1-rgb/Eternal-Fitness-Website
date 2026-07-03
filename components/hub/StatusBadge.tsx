import { cn } from "@/lib/utils";
import { lookupStatus, getStatusClasses } from "@/lib/hubStatus";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const lookup = lookupStatus(status);
  if (!lookup) return null;
  const classes = getStatusClasses(lookup.token);
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      classes.bg,
      classes.text,
      classes.border,
      className,
    )}>
      {lookup.label}
    </span>
  );
}
