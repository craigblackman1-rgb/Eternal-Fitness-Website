import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconCalendar, IconFileText, IconFileSignature } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { KpiTile } from "@/components/hub/KpiTile";
import { HubCardHeader } from "@/components/hub/HubCardHeader";
import { DOCUMENT_KIND_LABEL, type DocumentKind } from "@/lib/documents/types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  signed: "default",
  sent: "secondary",
  draft: "outline",
  superseded: "outline",
};

function fmt(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Row {
  id: string;
  kind: string;
  title: string;
  status: string;
  version: number;
  created_at: string;
  clients: { client_number: number; name: string } | null;
}

export default async function AllDocumentsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_documents")
    .select("id, kind, title, status, version, created_at, clients(client_number, name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const signed = rows.filter((r) => r.status === "signed").length;
  const awaiting = rows.filter((r) => r.status === "sent").length;
  const drafts = rows.filter((r) => r.status === "draft").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">All Documents</h1>
        <p className="text-muted-foreground mt-1">Every document sent and signed, across all clients. Click through to the client&apos;s copy.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={<IconFileText className="w-5 h-5" />} label="Total" value={rows.length} />
        <KpiTile icon={<IconFileSignature className="w-5 h-5" />} label="Signed" value={signed} />
        <KpiTile icon={<IconCalendar className="w-5 h-5" />} label="Awaiting signature" value={awaiting} />
        <KpiTile icon={<IconFileText className="w-5 h-5" />} label="Drafts" value={drafts} />
      </div>

      <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
        <HubCardHeader icon={<IconFileSignature className="w-4 h-4" />} title="Documents" />
        <CardContent>
          {error && <p className="text-sm text-rose py-6 text-center">Error loading documents: {error.message}</p>}
          {!error && rows.length === 0 && (
            <EmptyState
              icon={<IconFileText className="w-7 h-7" />}
              title="No documents yet"
              description="Create documents from a client's profile or send one from a template."
            />
          )}
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-[var(--hub-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-canvas)] text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">Client</th>
                    <th className="px-3 py-2 text-left font-medium">Document</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--hub-border)] last:border-0 hover:bg-[var(--hub-hover)]">
                      <td className="px-3 py-2 font-medium text-foreground">{r.clients?.name ?? "—"}</td>
                      <td className="px-3 py-2 text-foreground">
                        {DOCUMENT_KIND_LABEL[r.kind as DocumentKind] ?? r.title}
                        {r.version > 1 && <span className="text-muted-foreground"> (v{r.version})</span>}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={STATUS_VARIANT[r.status] ?? "outline"} className="rounded-full text-xs capitalize">{r.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{fmt(r.created_at)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {r.clients?.client_number != null && (
                          <Link href={`/hub/clients/${r.clients.client_number}/documents/${r.id}`} className="text-rose font-medium hover:underline">
                            Open
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
