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
  source: "Engine" | "Agreement" | "PAR-Q";
  status: string;
  date: string;
  href: string | null;
}

type Joined = { client_number: number; name: string } | null;

export default async function AllDocumentsPage() {
  const supabase = createClient();

  const [{ data: docs }, { data: agreements }, { data: parqs }] = await Promise.all([
    supabase.from("client_documents").select("id, kind, title, status, version, created_at, clients(client_number, name)").order("created_at", { ascending: false }),
    supabase.from("signed_agreements").select("id, status, signed_at, sent_date, created_at, client_name, clients(client_number, name)").order("created_at", { ascending: false }),
    supabase.from("signed_parq").select("id, status, signed_at, sent_date, created_at, full_name, clients(client_number, name)").order("created_at", { ascending: false }),
  ]);

  const rows: UnifiedRow[] = [
    ...((docs ?? []) as unknown as { id: string; kind: string; title: string; status: string; version: number; created_at: string; clients: Joined }[]).map((d) => ({
      key: `doc-${d.id}`,
      clientName: d.clients?.name ?? "—",
      clientNumber: d.clients?.client_number ?? null,
      label: `${DOCUMENT_KIND_LABEL[d.kind as DocumentKind] ?? d.title}${d.version > 1 ? ` (v${d.version})` : ""}`,
      source: "Engine" as const,
      status: d.status,
      date: d.created_at,
      href: d.clients?.client_number != null ? `/hub/clients/${d.clients.client_number}/documents/${d.id}` : null,
    })),
    ...((agreements ?? []) as unknown as { id: string; status: string; signed_at: string | null; sent_date: string | null; created_at: string; client_name: string | null; clients: Joined }[]).map((a) => ({
      key: `agreement-${a.id}`,
      clientName: a.clients?.name ?? a.client_name ?? "—",
      clientNumber: a.clients?.client_number ?? null,
      label: "Personal Training Agreement",
      source: "Agreement" as const,
      status: a.status || "signed",
      date: a.signed_at ?? a.sent_date ?? a.created_at,
      href: `/hub/agreements/${a.id}`,
    })),
    ...((parqs ?? []) as unknown as { id: string; status: string; signed_at: string | null; sent_date: string | null; created_at: string; full_name: string | null; clients: Joined }[]).map((p) => ({
      key: `parq-${p.id}`,
      clientName: p.clients?.name ?? p.full_name ?? "—",
      clientNumber: p.clients?.client_number ?? null,
      label: "PAR-Q",
      source: "PAR-Q" as const,
      status: p.status || "signed",
      date: p.signed_at ?? p.sent_date ?? p.created_at,
      href: p.clients?.client_number != null ? `/hub/clients/${p.clients.client_number}/parq` : null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const signed = rows.filter((r) => r.status === "signed").length;
  const awaiting = rows.filter((r) => r.status === "sent").length;
  const drafts = rows.filter((r) => r.status === "draft").length;

  return (
    <div className="space-y-6">
      <HubPageHeader
        title="All Documents"
        subtitle="Every document sent and signed across all clients — new documents plus legacy PAR-Qs and agreements. Click through to each one."
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
