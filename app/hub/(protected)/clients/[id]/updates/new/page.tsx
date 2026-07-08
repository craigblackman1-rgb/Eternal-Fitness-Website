import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { NewUpdateClient } from "./NewUpdateClient";

export default async function NewUpdatePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, client_number, name")
    .eq("client_number", parseInt(params.id))
    .single();

  if (!client) notFound();

  // Prefill the send-to address. Prefer the master record, then fall back to the
  // email captured on the client's signed PAR-Q or agreement — no re-typing.
  let defaultEmail = "";
  let defaultEmailSource = "";

  const { data: master } = await supabase.from("clients").select("email").eq("id", client.id).single();
  if (master?.email) {
    defaultEmail = master.email;
    defaultEmailSource = "the client record";
  }

  if (!defaultEmail) {
    const { data: parq } = await supabase
      .from("signed_parq")
      .select("email")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (parq?.email) {
      defaultEmail = parq.email;
      defaultEmailSource = "the signed PAR-Q";
    }
  }

  if (!defaultEmail) {
    const { data: agreement } = await supabase
      .from("signed_agreements")
      .select("client_email")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (agreement?.client_email) {
      defaultEmail = agreement.client_email;
      defaultEmailSource = "the signed agreement";
    }
  }

  return (
    <NewUpdateClient
      clientNumber={client.client_number}
      clientName={client.name}
      defaultEmail={defaultEmail}
      defaultEmailSource={defaultEmailSource}
    />
  );
}
