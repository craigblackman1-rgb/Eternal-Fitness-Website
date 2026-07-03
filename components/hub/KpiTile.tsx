import { cn } from "@/lib/utils";
import { getStatusClasses, type StatusToken } from "@/lib/hubStatus";

interface KpiTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  statusToken?: StatusToken;
  className?: string;
}

export function KpiTile({ icon, label, value, trend, trendUp, statusToken = "primary", className }: KpiTileProps) {
  const c = getStatusClasses(statusToken);

  return (
    <div className={cn("bg-white rounded-2xl border border-border/60 shadow-sm p-4", className)}>
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", c.bg, c.text)}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
              trendUp === false
                ? "bg-[var(--status-danger-bg)] text-[var(--status-danger)]"
                : "bg-[var(--status-success-bg)] text-[var(--status-success)]",
            )}
          >
            {trendUp === false ? "↓" : "↑"}{trend}
          </span>
        )}
      </div>
    </div>
  );
}
