import { cn } from "@/lib/utils";

interface HubDataGridProps {
  children: React.ReactNode;
  /** Number of columns. Defaults to 2 on mobile, 3 on sm+. */
  cols?: 2 | 3 | 4;
  className?: string;
}

interface HubDataFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  /** Span multiple columns. */
  span?: boolean;
}

/**
 * Grid container for key-value data fields. Use with <HubDataField>.
 */
export function HubDataGrid({ children, cols = 2, className }: HubDataGridProps) {
  const colClass = cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={cn("grid grid-cols-1 gap-x-6 gap-y-4", colClass, className)}>
      {children}
    </div>
  );
}

/**
 * Single key-value field inside a <HubDataGrid>.
 */
export function HubDataField({ label, children, className, span }: HubDataFieldProps) {
  return (
    <div className={cn(span ? "sm:col-span-2 lg:col-span-3" : "", className)}>
      <span className="text-xs text-muted-foreground block mb-1">{label}</span>
      <span className="font-medium text-foreground text-sm">{children}</span>
    </div>
  );
}
