import Link from "next/link";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { SendDocumentLink } from "@/components/hub/SendDocumentLink";
import { IconFileText, IconFileSignature } from "@/components/icons";
import type { SignedAgreement, SignedPARQ } from "@/types";

interface DocumentRegisterProps {
  clientNumber: number;
  parqs: SignedPARQ[];
  agreements: SignedAgreement[];
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
  kind: "PAR-Q" | "Agreement";
  status: string;
  date: string;
  href: string;
  editHref?: string;
  icon: React.ReactNode;
};

export function DocumentRegister({ clientNumber, parqs, agreements }: DocumentRegisterProps) {
  const rows: Row[] = [
    ...parqs.map((p) => ({
      key: `parq-${p.id}`,
      kind: "PAR-Q" as const,
      status: p.status,
      date: docDate(p.status, p.sent_date, p.received_date, p.signed_at, p.created_at),
      href: `/hub/clients/${clientNumber}/parq`,
      editHref: `/hub/clients/${clientNumber}/parq/${p.id}/edit`,
      icon: <IconFileText className="h-4 w-4 text-muted-foreground" />,
    })),
    ...agreements.map((a) => ({
      key: `agreement-${a.id}`,
      kind: "Agreement" as const,
      status: a.status,
      date: docDate(a.status, a.sent_date, a.received_date, a.signed_at, a.created_at),
      href: `/hub/agreements/${a.id}`,
      icon: <IconFileSignature className="h-4 w-4 text-muted-foreground" />,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Document register</span>
        <div className="flex items-center gap-2">
          <SendDocumentLink path="/parq" clientNumber={clientNumber} label="Send PAR-Q" />
          <SendDocumentLink path="/agreement" clientNumber={clientNumber} label="Send Agreement" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No PAR-Q or agreement on file yet — send one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--hub-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-canvas)] text-xs text-muted-foreground">
                <th className="px-3 py-1.5 text-left font-medium">Document</th>
                <th className="px-3 py-1.5 text-left font-medium">Status</th>
                <th className="px-3 py-1.5 text-left font-medium">Date</th>
                <th className="px-3 py-1.5 text-right font-medium">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-[var(--hub-border)] last:border-0 hover:bg-[var(--hub-hover)]">
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">{r.icon}{r.kind}</span>
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {r.editHref && (
                      <Link href={r.editHref} className="text-teal font-medium hover:underline mr-3">Edit</Link>
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
