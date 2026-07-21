import { createClient } from "@/lib/supabase-server";
import { IconSend, IconClock, IconFileText, IconAlertTriangle } from "@/components/icons";
import { UpdatesReport } from "./UpdatesReport";
import type { UpdateWithClient } from "@/types";

export const dynamic = "force-dynamic";

export default async function UpdatesReportPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("sent_updates")
    .select("*, client:clients(name, client_number)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) console.error("[reports/updates]", error.message);

  const updates = (data || []) as UpdateWithClient[];

  const stat = (s: string) => updates.filter((u) => u.status === s).length;
  const tiles = [
    { label: "Sent", value: stat("sent"), icon: IconSend, tone: "rose" },
    { label: "Scheduled", value: stat("scheduled"), icon: IconClock, tone: "teal" },
    { label: "Drafts", value: stat("draft"), icon: IconFileText, tone: "amber" },
    { label: "Failed", value: stat("failed"), icon: IconAlertTriangle, tone: "destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Email updates</h1>
        <p className="text-sm text-muted-foreground mt-1">6-week progress emails sent to clients and, with consent, their referrers.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {tiles.map((t) => {
          const Icon = t.icon;
          const toneStyles: Record<string, string> = {
            rose: "bg-[var(--status-primary-bg)] text-[var(--status-primary)]",
            teal: "bg-[var(--status-success-bg)] text-[var(--status-success)]",
            amber: "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
            destructive: "bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
          };
          return (
            <div key={t.label} className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm p-4 flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${toneStyles[t.tone]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground leading-none">{t.label}</p>
                <p className="text-2xl font-bold leading-tight text-foreground mt-1.5 tabular-nums">{t.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <UpdatesReport updates={updates} />
    </div>
  );
}
