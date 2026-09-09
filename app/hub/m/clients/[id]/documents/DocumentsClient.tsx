"use client";

import Link from "next/link";

interface DocRow {
  id: string;
  kind: string;
  title: string | null;
  status: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  emailed?: boolean;
  source_type?: string;
  legacy?: boolean;
}

interface DocumentsClientProps {
  allDocs: DocRow[];
  clientNumber: number;
}

function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtFullDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const ICO = {
  chev: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

export function DocumentsClient({ allDocs, clientNumber }: DocumentsClientProps) {
  const needsAction = allDocs.filter((d) => d.status === "sent" || d.status === "draft");
  const onFile = allDocs.filter((d) => d.status === "signed" || d.status === "superseded");

  return (
    <>
      {/* Needs action */}
      {needsAction.length > 0 && (
        <div className="mcard">
          <div className="mcard-h">Needs action</div>
          {needsAction.map((doc) => (
            <div key={doc.id} className="mrow">
              <div className="mrow-body">
                <div className="mrow-t">{doc.title || doc.kind}</div>
                <div className="mrow-s">
                  {doc.status === "draft"
                    ? `Created ${fmtShortDate(doc.created_at)}`
                    : `Sent ${fmtShortDate(doc.updated_at || doc.created_at)}${doc.emailed === false ? " · Not delivered" : ""}`
                  }
                </div>
              </div>
              <span className={`pill ${doc.status === "draft" ? "p-mut" : "p-warn"}`}>
                {doc.status === "draft" ? "Draft" : "Awaiting signature"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* On file */}
      <div className="mcard">
        <div className="mcard-h">On file</div>
        {onFile.length > 0 ? (
          onFile.map((doc) => (
            <Link
              key={doc.id}
              className="mrow"
              href={`/hub/clients/${clientNumber}/documents/${doc.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="mrow-body">
                <div className="mrow-t">{doc.title || doc.kind}</div>
                <div className="mrow-s">
                  {doc.status === "signed"
                    ? `Signed ${fmtShortDate(doc.updated_at || doc.created_at)}${doc.legacy ? " · legacy record" : ""}`
                    : doc.status === "superseded"
                      ? `Superseded${doc.legacy ? " · legacy record" : ""}`
                      : doc.status}
                </div>
              </div>
              <span className={`pill ${doc.status === "signed" ? "p-ok" : "p-mut"}`}>
                {doc.status === "signed" ? "Signed" : "Superseded"}
              </span>
              <span className="mrow-chevron">{ICO.chev}</span>
            </Link>
          ))
        ) : (
          <div className="mrow" style={{ justifyContent: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>No documents on file.</span>
          </div>
        )}
      </div>

      {/* Send a document — links to desktop documents page */}
      <Link
        className="mbtn"
        href={`/hub/clients/${clientNumber}/documents`}
        style={{ marginTop: 14, textDecoration: "none" }}
      >
        Send a document
      </Link>

      {/* Note */}
      <p className="mnote">
        &ldquo;Send&rdquo; opens the same document engine as desktop — pick a kind, preview, send a sign-link.
        Tapping a row opens the document view with delivery and open history. Resend from there.
      </p>
    </>
  );
}
