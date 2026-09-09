import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { CommsComposerClient } from "./CommsComposerClient";
import type { SentUpdate } from "@/types";

export const dynamic = "force-dynamic";

export default async function CommsComposerPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const clientNumber = parseInt(params.id);

  const { data: client } = await supabase
    .from("clients")
    .select("id, client_number, name, sessions_purchased, sessions_used")
    .eq("client_number", clientNumber)
    .single();

  if (!client) notFound();

  const { data: updates } = await supabase
    .from("sent_updates")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  return (
    <CommsComposerClient
      clientNumber={clientNumber}
      clientName={client.name}
      sessionsPurchased={client.sessions_purchased}
      sessionsUsed={client.sessions_used}
      updates={(updates || []) as SentUpdate[]}
    />
  );
}
