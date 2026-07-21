import { cn } from "@/lib/utils";
import { IconTriangleAlert, IconAlertCircle, IconCheckCircle } from "@/components/icons";

type Severity = "danger" | "warning" | "info" | "success";

interface HubAlertProps {
  severity: Severity;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Banner-grade alert for the Trainer Hub. `danger` is deliberately loud —
 * it is used for clinical safety states (Do Not Train) and must be
 * impossible to miss or mistake for decoration.
 */
export function HubAlert({ severity, title, children, action, className }: HubAlertProps) {
  if (severity === "danger") {
    return (
      <div
        role="alert"
        className={cn(
          "rounded-xl bg-[var(--status-danger-solid)] text-[var(--status-danger-solid-fg)] px-5 py-4 shadow-md",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <IconAlertCircle className="w-[18px] h-[18px] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm uppercase tracking-wide">{title}</p>
            {children && <div className="text-sm text-white/85 mt-1">{children}</div>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    );
  }

  const styles: Record<Exclude<Severity, "danger">, { bg: string; text: string; border: string; Icon: typeof IconAlertCircle }> = {
    warning: {
      bg: "bg-[var(--status-warning-bg)]",
      text: "text-[var(--status-warning-text)]",
      border: "border-[var(--status-warning-border)]",
      Icon: IconTriangleAlert,
    },
    success: {
      bg: "bg-[var(--status-success-bg)]",
      text: "text-[var(--status-success-text)]",
      border: "border-[var(--status-success-border)]",
      Icon: IconCheckCircle,
    },
    info: {
      bg: "bg-[var(--hub-hover)]",
      text: "text-slate",
      border: "border-[var(--hub-border)]",
      Icon: IconAlertCircle,
    },
  };
  const { bg, text, border, Icon } = styles[severity];

  return (
    <div role="status" className={cn("rounded-xl border px-4 py-3", bg, border, className)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn("w-[18px] h-[18px] shrink-0 mt-0.5", text)} />
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-sm", text)}>{title}</p>
          {children && <div className="text-sm text-foreground/75 mt-0.5">{children}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
