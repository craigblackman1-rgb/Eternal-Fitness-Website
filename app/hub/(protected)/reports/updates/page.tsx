import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { IconMail, IconClock, IconFileText, IconAlertTriangle } from "@/components/icons";
import { UpdatesReport } from "./UpdatesReport";
import type { UpdateWithClient } from "@/types";

export const dynamic = "force-dynamic";

export default async function UpdatesReportPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("sent_updates")
    .select("*, client:clients(name, client_number)")
    .order("created_at", { ascending: false })
    .limit(500);

  const updates = (data || []) as UpdateWithClient[];

  const stat = (s: string) => updates.filter((u) => u.status === s).length;
  const tiles = [
    { label: "Sent", value: stat("sent"), icon: IconMail, tone: "text-rose" },
    { label: "Scheduled", value: stat("scheduled"), icon: IconClock, tone: "text-teal" },
    { label: "Drafts", value: stat("draft"), icon: IconFileText, tone: "text-muted-foreground" },
    { label: "Failed", value: stat("failed"), icon: IconAlertTriangle, tone: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Email Updates</h1>
        <p className="text-muted-foreground">Everything sent, scheduled, and drafted across all clients.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label} className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 border border-[var(--hub-border)]">
                  <Icon className={`h-5 w-5 ${t.tone}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground leading-none">{t.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <UpdatesReport updates={updates} />
    </div>
  );
}
