import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconCalendar, IconEye, IconFileSignature, IconMail, IconPhone } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { KpiTile } from "@/components/hub/KpiTile";
import { HubCardHeader } from "@/components/hub/HubCardHeader";

export default async function AgreementsPage() {
  const supabase = createClient();

  const { data: agreements, error } = await supabase
    .from("signed_agreements")
    .select("*, clients(client_number)")
    .order("signed_at", { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Signed Agreements</h1>
        <p className="text-muted-foreground mt-1">View and manage all signed personal training agreements</p>
      </div>

      {/* Stats — branded */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <KpiTile icon={<IconFileSignature className="w-5 h-5" />} label="Total agreements" value={agreements?.length ?? 0} />
        <KpiTile icon={<IconEye className="w-5 h-5" />} label="PAR-Q on file" value={agreements?.filter((a) => a.parq_completed === "yes").length ?? 0} />
        <KpiTile icon={<IconCalendar className="w-5 h-5" />} label="Medical clearance filed" value={agreements?.filter((a) => a.medical_clearance === "yes").length ?? 0} />
      </div>

      {/* Agreements list */}
      <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
        <HubCardHeader icon={<IconFileSignature className="w-4 h-4" />} title="All Agreements" />
        <CardContent>
          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-rose">Error loading agreements: {error.message}</p>
            </div>
          )}

          {!error && (!agreements || agreements.length === 0) && (
            <EmptyState
              icon={<IconFileSignature className="w-7 h-7" />}
              title="No signed agreements yet"
              description={<>Agreements will appear here once clients sign at <code className="text-rose bg-rose/5 px-1.5 py-0.5 rounded">/agreement</code></>}
            />
          )}

          {agreements && agreements.length > 0 && (
            <div className="space-y-3">
              {agreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-[var(--hub-border)] hover:bg-[var(--hub-hover)] transition-colors"
                >
                  {/* Client info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {agreement.client_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {agreement.client_email && (
                        <span className="flex items-center gap-1">
                          <IconMail className="w-3 h-3" />
                          {agreement.client_email}
                        </span>
                      )}
                      {agreement.client_phone && (
                        <span className="flex items-center gap-1">
                          <IconPhone className="w-3 h-3" />
                          {agreement.client_phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    {agreement.parq_completed === "yes" && (
                      <Badge variant="default" className="text-xs rounded-full">PAR-Q filed</Badge>
                    )}
                    {agreement.parq_completed === "no" && (
                      <Badge variant="secondary" className="text-xs rounded-full">PAR-Q missing</Badge>
                    )}
                    {agreement.medical_clearance === "yes" && (
                      <Badge variant="default" className="text-xs rounded-full">Clearance filed</Badge>
                    )}
                    {agreement.medical_clearance === "na" && (
                      <Badge variant="outline" className="text-xs rounded-full">No clearance needed</Badge>
                    )}
                  </div>

                  {/* Date and actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconCalendar className="w-3 h-3" />
                      {new Date(agreement.signed_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {agreement.clients?.client_number && (
                      <Link
                        href={`/hub/clients/${agreement.clients.client_number}?tab=profile-compliance`}
                        className="text-xs text-rose hover:underline font-medium whitespace-nowrap"
                      >
                        View profile
                      </Link>
                    )}
                    <Link href={`/hub/agreements/${agreement.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-rose/10 hover:text-rose">
                        <IconEye className="w-4 h-4" />
                        <span className="sr-only">View agreement for {agreement.client_name}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
