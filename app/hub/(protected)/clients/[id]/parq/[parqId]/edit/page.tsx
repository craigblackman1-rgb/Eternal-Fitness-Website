import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ParqEditClient from "@/app/parq/edit/[id]/ParqEditClient";

// Esther-facing PAR-Q editor. Reuses the client edit form in admin mode so she
// can update fields and save without a signature, then hand the client a link to
// finish and sign the same record.
export default async function HubParqEditPage({ params }: { params: { id: string; parqId: string } }) {
  const supabase = createClient();

  const { data: parq } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("id", params.parqId)
    .single();

  if (!parq) notFound();

  return <ParqEditClient parq={parq} adminMode clientNumber={parseInt(params.id)} />;
}
