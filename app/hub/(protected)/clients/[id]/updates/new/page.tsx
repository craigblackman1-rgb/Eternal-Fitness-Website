import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { NewUpdateClient } from "./NewUpdateClient";

export default async function NewUpdatePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("client_number, name")
    .eq("client_number", parseInt(params.id))
    .single();

  if (!client) notFound();

  return <NewUpdateClient clientNumber={client.client_number} clientName={client.name} />;
}
