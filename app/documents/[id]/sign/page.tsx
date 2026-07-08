import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { DocumentSignClient } from "./DocumentSignClient";
import type { ClientDocument } from "@/lib/documents/types";

export const dynamic = "force-dynamic";

export default async function DocumentSignPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("client_documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!doc) notFound();

  return <DocumentSignClient doc={doc as ClientDocument} />;
}
