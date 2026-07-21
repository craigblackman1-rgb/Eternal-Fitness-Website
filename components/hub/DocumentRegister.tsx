import Link from "next/link";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { SendDocumentLink } from "@/components/hub/SendDocumentLink";
import { IconFileText, IconFileSignature, IconPlus } from "@/components/icons";
import { DOCUMENT_KIND_LABEL, type DocumentKind } from "@/lib/documents/types";
import { mintParqLinkParams } from "@/lib/parq-link";
import type { SignedAgreement, SignedPARQ } from "@/types";

interface RegisterDocument {
  id: string;
  kind: string;
  title: string;
  status: string;
  version: number;
  created_at: string;
  updated_at?: string | null;
  client_name?: string | null;
  trainer_name?: string | null;
}

interface DocumentRegisterProps {
  clientNumber: number;
  parqs: SignedPARQ[];
  agreements: SignedAgreement[];
  documents?: RegisterDocument[];
  clientEmail?: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The most relevant date for a document, given its status. */
function docDate(status: string, sent: string | null, received: string | null, signed: string | null, created: string) {
  if (status === "signed") return signed ?? received ?? created;
  if (status === "received") return received ?? created;
  if (status === "sent") return sent ?? created;
  return created;
}

type Row = {
  key: string;
  label: string;
  status: string;
  date: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  href: string;
  editHref?: string;
  icon: React.ReactNode;
};

export function DocumentRegister({ clientNumber, parqs, agreements, documents = [], clientEmail }: DocumentRegisterProps) {
  // Latest PAR-Q on file (parqs arrive newest-first). If one exists, "Send PAR-Q"
  // links the client to their existing document to update it, not a blank form.
  const latestParqId = parqs[0]?.id;
  const parqLink = latestParqId ? mintParqLinkParams(latestParqId) : null;
  const rows: Row[] = [
    ...parqs.map((p) => ({
      key: `parq-${p.id}`,
      label: "PAR-Q",
      status: p.status,
      date: docDate(p.status, p.sent_date, p.received_date, p.signed_at, p.created_at),
      version: p.version ?? 1,
      updatedAt: p.updated_at || p.created_at,
      updatedBy: p.client_name_print || p.client_typed_signature || p.full_name || "—",
      href: `/hub/clients/${clientNumber}/parq`,
      editHref: `/hub/clients/${clientNumber}/parq/${p.id}/edit`,
      icon: <IconFileText className="h-4 w-4 text-muted-foreground" />,
    })),
    ...agreements.map((a) => ({
      key: `agreement-${a.id}`,
      label: "Personal Training Agreement",
      status: a.status,
      date: docDate(a.status, a.sent_date, a.received_date, a.signed_at, a.created_at),
      version: 1,
      updatedAt: a.updated_at || a.created_at,
      updatedBy: a.client_name_print || a.client_typed_signature || a.client_name || "—",
      href: `/hub/agreements/${a.id}`,
      icon: <IconFileSignature className="h-4 w-4 text-muted-foreground" />,
    })),
    ...documents.map((d) => ({
      key: `doc-${d.id}`,
      label: `${DOCUMENT_KIND_LABEL[d.kind as DocumentKind] ?? d.title}${d.version > 1 ? ` (v${d.version})` : ""}`,
      status: d.status,
      date: d.created_at,
      version: d.version ?? 1,
      updatedAt: d.updated_at || d.created_at,
      updatedBy: d.client_name || d.trainer_name || "—",
      href: `/hub/clients/${clientNumber}/documents/${d.id}`,
      editHref: `/hub/clients/${clientNumber}/documents/${d.id}`,
      icon: <IconFileSignature className="h-4 w-4 text-muted-foreground" />,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Document register</span>
        <div className="flex items-center gap-2">
          <SendDocumentLink
            path="/parq"
            clientNumber={clientNumber}
            label={latestParqId ? "Send PAR-Q update" : "Send PAR-Q"}
            existingId={latestParqId}
            exp={parqLink?.exp}
            sig={parqLink?.sig}
            clientEmail={clientEmail}
          />
          <Link
            href={`/hub/clients/${clientNumber}/documents`}
            className="inline-flex items-center gap-1 rounded-lg bg-rose px-2.5 h-7 text-xs font-medium text-white hover:bg-rose/90"
          >
            <IconPlus className="h-3 w-3" />
            New document
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No documents on file yet — create one with &ldquo;New document&rdquo; or send a PAR-Q.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--hub-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-canvas)] text-xs text-muted-foreground">
                <th className="px-3 py-1.5 text-left font-medium">Document</th>
                <th className="px-3 py-1.5 text-left font-medium">Status</th>
                <th className="px-3 py-1.5 text-left font-medium">Date</th>
                <th className="px-3 py-1.5 text-left font-medium">Version</th>
                <th className="px-3 py-1.5 text-left font-medium">Last updated</th>
                <th className="px-3 py-1.5 text-left font-medium">Last updated by</th>
                <th className="px-3 py-1.5 text-right font-medium">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-[var(--hub-border)] last:border-0 hover:bg-[var(--hub-hover)]">
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">{r.icon}{r.label}</span>
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">v{r.version}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(r.updatedAt)}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{r.updatedBy}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {r.editHref && (
                      <Link href={r.editHref} className="text-teal font-medium hover:underline mr-3">Open</Link>
                    )}
                    <Link href={r.href} className="text-rose font-medium hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
