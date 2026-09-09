import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentsClient } from "./DocumentsClient";
import { ClientTabBar } from "../ClientTabBar";

const ICO = {
  back: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  monitor: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

export default async function MobileDocumentsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const clientNumber = parseInt(params.id, 10);

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, client_number")
    .eq("client_number", clientNumber)
    .single();

  if (!client) notFound();

  // Mirror the desktop DocumentsDrawer data sources exactly
  const [
    { data: clientDocuments },
    { data: parqs },
    { data: agreements },
  ] = await Promise.all([
    supabase
      .from("client_documents")
      .select("id, kind, title, status, version, created_at, updated_at, emailed, source_type")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("signed_parq")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("signed_agreements")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
  ]);

  const latestParq = (parqs?.[0] ?? null) as { id: string; created_at: string } | null;
  const latestAgreement = (agreements?.[0] ?? null) as { id: string; created_at: string; status?: string } | null;
  const hasSignedParqDocument = (clientDocuments ?? []).some(
    (d: { kind: string; status: string }) => d.kind === "parq" && d.status === "signed",
  );
  const hasSignedAgreementDocument = (clientDocuments ?? []).some(
    (d: { kind: string; status: string }) => d.kind === "terms" && d.status === "signed",
  );

  // Synthesize legacy rows — same logic as desktop page.tsx
  const legacyDocumentRows = [
    !hasSignedParqDocument && latestParq
      ? { id: `legacy-parq-${latestParq.id}`, kind: "parq", title: "PAR-Q (legacy record)", status: "signed", version: 1, created_at: latestParq.created_at, legacy: true }
      : null,
    !hasSignedAgreementDocument && latestAgreement?.status === "signed"
      ? { id: `legacy-agreement-${latestAgreement.id}`, kind: "terms", title: "Personal Training Agreement (legacy record)", status: "signed", version: 1, created_at: latestAgreement.created_at, legacy: true }
      : null,
  ].filter(Boolean);

  const allDocs = [...(clientDocuments ?? []), ...legacyDocumentRows];

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <Link className="mtop-back" href={`/hub/m/clients/${clientNumber}`} aria-label="Back to client">
            {ICO.back}
          </Link>
          <span className="mtop-t" style={{ flex: 1, minWidth: 0 }}>
            {client.name.split(" ")[0]}&apos;s documents
          </span>
          <Link className="desktop-link" href={`/hub/clients/${clientNumber}/documents`}>
            {ICO.monitor}
            Desktop
          </Link>
        </div>
      </header>

      <main className="mcontent">
        <DocumentsClient
          allDocs={allDocs}
          clientNumber={clientNumber}
          clientName={client.name}
        />
      </main>

      <ClientTabBar clientNumber={clientNumber} activeTab="documents" />
    </>
  );
}
