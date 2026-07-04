import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { DocumentDetailClient } from "./DocumentDetailClient";
import type { ClientDocument } from "@/lib/documents/types";

export default async function DocumentDetailPage({ params }: { params: { id: string; docId: string } }) {
  const supabase = createClient();
  const { data: doc } = await supabase
    .from("client_documents")
    .select("*")
    .eq("id", params.docId)
    .single();
  if (!doc) notFound();

  return <DocumentDetailClient clientNumber={parseInt(params.id)} doc={doc as ClientDocument} />;
}
