import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HubCard, HubCardHeader } from "@/components/hub";
import { IconMail, IconClock, IconCalendar, IconPlus } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { UpdateRowActions } from "@/components/hub/UpdateRowActions";
import { getTemplateKind } from "@/lib/email-templates/registry";
import { updateStatusMeta, formatUpdateTime } from "@/lib/updates/status";
import type { SentUpdate } from "@/types";

const STATUS_ORDER: Record<string, number> = { scheduled: 0, draft: 1, failed: 2, sent: 3, cancelled: 4 };

/** Compact updates list for the client profile Updates tab. */
export function ClientUpdatesPanel({ clientNumber, updates }: { clientNumber: number; updates: SentUpdate[] }) {
  const sorted = [...updates].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (s !== 0) return s;
    const at = new Date(a.sent_at || a.scheduled_for || a.created_at).getTime();
    const bt = new Date(b.sent_at || b.scheduled_for || b.created_at).getTime();
    return bt - at;
  });

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<IconMail className="w-7 h-7" />}
        title="No updates yet"
        description="Generate a branded 6-week update from this client's training data, then review, schedule, or send it."
        cta={{ label: "New Update", href: `/hub/clients/${clientNumber}/updates/new` }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link href={`/hub/clients/${clientNumber}/updates/new`}>
          <Button size="sm" className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
            <IconPlus className="h-4 w-4" />
            New Update
          </Button>
        </Link>
      </div>

      {sorted.map((u) => {
        const meta = updateStatusMeta(u.status);
        const isScheduled = u.status === "scheduled";
        const timeLabel = isScheduled
          ? `Sends ${formatUpdateTime(u.scheduled_for)}`
          : u.status === "draft"
            ? `Saved ${formatUpdateTime(u.created_at)}`
            : formatUpdateTime(u.sent_at || u.created_at);

        return (
          <HubCard key={u.id}>
            <HubCardHeader
              icon={isScheduled ? <IconClock className="w-4 h-4" /> : <IconMail className="w-4 h-4" />}
              title={u.subject}
              subtitle={
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <IconCalendar className="h-3 w-3" />
                    {timeLabel}
                  </span>
                  <Badge variant={meta.variant} className="rounded-full text-xs">{meta.label}</Badge>
                  {u.block_number > 0 && (
                    <Badge variant="outline" className="rounded-full text-xs">Block {u.block_number}</Badge>
                  )}
                  {u.status === "sent" && (
                    <Badge variant={u.emailed ? "default" : "secondary"} className="rounded-full text-xs">
                      {u.emailed ? "Emailed" : "Not sent"}
                    </Badge>
                  )}
                </div>
              }
              color="teal"
              action={<UpdateRowActions clientNumber={clientNumber} updateId={u.id} status={u.status} hasEmail={!!u.client_email} />}
              noBottomPadding
            />
          </HubCard>
        );
      })}
    </div>
  );
}
