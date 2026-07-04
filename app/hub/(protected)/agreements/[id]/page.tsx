import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import AgreementDetailClient from "./AgreementDetailClient";

export default async function AgreementDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: agreement } = await supabase
    .from("signed_agreements")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!agreement) {
    notFound();
  }

  let clientNumber: number | null = null;
  if (agreement.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("client_number")
      .eq("id", agreement.client_id)
      .maybeSingle();
    clientNumber = client?.client_number ?? null;
  }

  return <AgreementDetailClient agreement={agreement} clientNumber={clientNumber} />;
}
