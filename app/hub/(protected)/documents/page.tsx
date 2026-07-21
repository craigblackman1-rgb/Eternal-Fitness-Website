import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { HubCard, HubPageHeader, KpiTile, StatusBadge, EmptyState } from "@/components/hub";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconCalendar, IconFileText, IconFileSignature } from "@/components/icons";
import { DOCUMENT_KIND_LABEL, type DocumentKind } from "@/lib/documents/types";

function fmt(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface UnifiedRow {
  key: string;
  clientName: string;
  clientNumber: number | null;
  label: string;
  status: string;
  date: string;
  href: string | null;
}

type Joined = { client_number: number; name: string } | null;

// PAR-Q and Personal Training Agreement both moved onto the document engine
// (client_documents) 2026-07-21 — this list reads only client_documents now.
// signed_agreements/signed_parq still exist for pre-migration history but are
// deliberately not queried here, to avoid double-listing every migrated row.
export default async function AllDocumentsPage() {
  const supabase = createClient();

  const { data: docs } = await supabase
    .from("client_documents")
    .select("id, kind, title, status, version, created_at, clients(client_number, name)")
    .order("created_at", { ascending: false });

  const rows: UnifiedRow[] = (
    (docs ?? []) as unknown as { id: string; kind: string; title: string; status: string; version: number; created_at: string; clients: Joined }[]
  ).map((d) => ({
    key: `doc-${d.id}`,
    clientName: d.clients?.name ?? "—",
    clientNumber: d.clients?.client_number ?? null,
    label: `${DOCUMENT_KIND_LABEL[d.kind as DocumentKind] ?? d.title}${d.version > 1 ? ` (v${d.version})` : ""}`,
    status: d.status,
    date: d.created_at,
    href: d.clients?.client_number != null ? `/hub/clients/${d.clients.client_number}/documents/${d.id}` : null,
  }));

  const signed = rows.filter((r) => r.status === "signed").length;
  const awaiting = rows.filter((r) => r.status === "sent").length;
  const drafts = rows.filter((r) => r.status === "draft").length;

  return (
    <div className="space-y-6">
      <HubPageHeader
        title="All Documents"
        subtitle="Every document sent and signed across all clients. Click through to each one."
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={<IconFileText className="w-5 h-5" />} label="Total" value={rows.length} />
        <KpiTile icon={<IconFileSignature className="w-5 h-5" />} label="Signed" value={signed} statusToken="success" />
        <KpiTile icon={<IconCalendar className="w-5 h-5" />} label="Awaiting signature" value={awaiting} statusToken="warning" />
        <KpiTile icon={<IconFileText className="w-5 h-5" />} label="Drafts" value={drafts} statusToken="neutral" />
      </div>

      {rows.length === 0 ? (
        <HubCard>
          <EmptyState
            icon={<IconFileText className="w-9 h-9" />}
            title="No documents yet"
            description="Create documents from a client's profile or send one from a template."
          />
        </HubCard>
      ) : (
        <HubCard padded={false}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--hub-border)] hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] h-10">Client</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] h-10">Document</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] h-10">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] h-10">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium bg-[var(--hub-hover)] h-10 text-right">&nbsp;</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key} className="border-[var(--hub-border)] hover:bg-[var(--hub-hover)] transition-colors">
                    <TableCell className="text-sm py-2.5 font-medium text-foreground">{r.clientName}</TableCell>
                    <TableCell className="text-sm py-2.5 text-foreground">{r.label}</TableCell>
                    <TableCell className="text-sm py-2.5">
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-sm py-2.5 text-muted-foreground whitespace-nowrap">{fmt(r.date)}</TableCell>
                    <TableCell className="text-sm py-2.5 text-right whitespace-nowrap">
                      {r.href ? (
                        <Link href={r.href} className="text-rose font-medium hover:underline">Open</Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </HubCard>
      )}
    </div>
  );
}
