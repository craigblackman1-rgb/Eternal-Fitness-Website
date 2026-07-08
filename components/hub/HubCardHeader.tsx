import { CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HubCardHeaderProps {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  color?: "rose" | "teal" | "navy" | "slate" | "amber";
  className?: string;
}

const badgeColors: Record<string, { bg: string; text: string }> = {
  rose: { bg: "bg-rose/10", text: "text-rose" },
  teal: { bg: "bg-teal/10", text: "text-teal" },
  navy: { bg: "bg-dark-navy/10", text: "text-dark-navy" },
  slate: { bg: "bg-slate/10", text: "text-slate" },
  amber: { bg: "bg-amber/10", text: "text-amber" },
};

export function HubCardHeader({ icon, title, action, color = "rose", className }: HubCardHeaderProps) {
  const c = badgeColors[color];
  return (
    <CardHeader className={cn("flex flex-row items-center justify-between pb-3", className)}>
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", c.bg, c.text)}>
          {icon}
        </div>
        {title}
      </CardTitle>
      {action && <div className="shrink-0">{action}</div>}
    </CardHeader>
  );
}
