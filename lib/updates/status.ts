import type { UpdateStatus } from "@/types";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
  /** Tailwind classes for a coloured dot / accent. */
  dot: string;
}

const META: Record<UpdateStatus, StatusMeta> = {
  draft: { label: "Draft", variant: "secondary", dot: "bg-muted-foreground" },
  scheduled: { label: "Scheduled", variant: "outline", dot: "bg-teal" },
  sent: { label: "Sent", variant: "default", dot: "bg-rose" },
  failed: { label: "Failed", variant: "destructive", dot: "bg-destructive" },
  cancelled: { label: "Cancelled", variant: "secondary", dot: "bg-muted-foreground" },
};

export function updateStatusMeta(status: UpdateStatus): StatusMeta {
  return META[status] ?? META.sent;
}

/** Short, human date+time for a scheduled/sent timestamp. */
export function formatUpdateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
