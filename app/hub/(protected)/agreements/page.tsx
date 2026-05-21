import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Download, Eye, Calendar, Mail, Phone } from "lucide-react";

export default async function AgreementsPage() {
  const supabase = createClient();

  const { data: agreements, error } = await supabase
    .from("signed_agreements")
    .select("*")
    .order("signed_at", { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Signed Agreements</h1>
        <p className="text-muted-foreground mt-1">View and manage all signed personal training agreements</p>
      </div>

      {/* Stats — branded */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm border-border/60 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center shrink-0">
              <FileSignature className="w-5 h-5 text-rose" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{agreements?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total agreements</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-teal" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {agreements?.filter((a) => a.parq_completed === "yes").length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">PAR-Q on file</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-dark-navy/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-dark-navy" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {agreements?.filter((a) => a.medical_clearance === "yes").length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Medical clearance filed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreements list */}
      <Card className="shadow-sm border-border/60 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center">
              <FileSignature className="w-4 h-4 text-rose" />
            </div>
            All Agreements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-rose">Error loading agreements: {error.message}</p>
            </div>
          )}

          {!error && (!agreements || agreements.length === 0) && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center">
                <FileSignature className="w-7 h-7 text-rose/40" />
              </div>
              <p className="text-sm text-muted-foreground">No signed agreements yet</p>
              <p className="text-xs text-muted-foreground">
                Agreements will appear here once clients sign at{" "}
                <code className="text-rose bg-rose/5 px-1.5 py-0.5 rounded">/agreement</code>
              </p>
            </div>
          )}

          {agreements && agreements.length > 0 && (
            <div className="space-y-3">
              {agreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/60 hover:bg-off-white hover:border-rose/20 transition-colors"
                >
                  {/* Client info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {agreement.client_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {agreement.client_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {agreement.client_email}
                        </span>
                      )}
                      {agreement.client_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
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
                      <Calendar className="w-3 h-3" />
                      {new Date(agreement.signed_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <Link href={`/hub/agreements/${agreement.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-rose/10 hover:text-rose">
                        <Eye className="w-4 h-4" />
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
