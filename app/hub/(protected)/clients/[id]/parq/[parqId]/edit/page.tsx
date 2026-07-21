import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { IconChevronLeft } from "@/components/icons";
import ParqEditClient from "@/app/parq/edit/[id]/ParqEditClient";
import { mintParqLinkParams } from "@/lib/parq-link";

// Esther-facing PAR-Q editor. Reuses the client edit form in admin mode so she
// can update fields and save without a signature, then hand the client a link to
// finish and sign the same record.
export default async function HubParqEditPage({ params }: { params: { id: string; parqId: string } }) {
  const supabase = createClient();

  const { data: client } = await supabase.from("clients").select("id, name, client_number").eq("client_number", parseInt(params.id)).single();
  if (!client) notFound();

  const { data: parq } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("id", params.parqId)
    .single();

  if (!parq) notFound();

  // The "copy client link" button hands Esther a link she can text/WhatsApp — it
  // must carry the same signed exp/sig pair the public /parq/edit/[id] page
  // requires, or it's rejected outright as invalid (see lib/parq-link.ts).
  const { exp: linkExp, sig: linkSig } = mintParqLinkParams(parq.id);

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/hub/clients/${client.client_number}/parq`} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md px-1 py-0.5 -ml-1 mb-3 transition-colors">
          <IconChevronLeft className="h-3.5 w-3.5" />
          Back to PAR-Q
        </Link>
        <div className="flex items-start gap-3.5">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit PAR-Q</h1>
            <p className="text-muted-foreground text-sm mt-1">{client.name}</p>
          </div>
        </div>
      </div>
      <ParqEditClient parq={parq} adminMode clientNumber={parseInt(params.id)} linkExp={linkExp} linkSig={linkSig} />
    </div>
  );
}
