import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { TemplateEditorClient } from "./TemplateEditorClient";
import type { DocumentTemplate } from "@/lib/documents/types";

export default async function TemplateEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("document_templates").select("*").eq("id", params.id).single();
  if (!data) notFound();
  return <TemplateEditorClient template={data as DocumentTemplate} />;
}
