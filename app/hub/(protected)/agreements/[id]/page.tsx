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

  return <AgreementDetailClient agreement={agreement} />;
}
