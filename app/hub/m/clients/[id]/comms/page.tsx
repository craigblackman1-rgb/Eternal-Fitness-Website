import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pronouns } from "@/lib/pronouns";
import { CommsClient } from "./CommsClient";
import { ClientTabBar } from "../ClientTabBar";

const ICO = {
  back: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  monitor: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

export default async function MobileCommsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const clientNumber = parseInt(params.id, 10);

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, client_number, gender")
    .eq("client_number", clientNumber)
    .single();

  if (!client) notFound();

  const { data: sentUpdates } = await supabase
    .from("sent_updates")
    .select("id, subject, status, sent_at, created_at, emailed, opened_at, open_count, click_count")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const p = pronouns(client.gender);

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <Link className="mtop-back" href={`/hub/m/clients/${clientNumber}`} aria-label="Back to client">
            {ICO.back}
          </Link>
          <span className="mtop-t" style={{ flex: 1, minWidth: 0 }}>
            Comms
          </span>
          <Link className="desktop-link" href={`/hub/clients/${clientNumber}/comms/new`}>
            {ICO.monitor}
            Desktop
          </Link>
        </div>
      </header>

      <main className="mcontent">
        <CommsClient
          firstName={client.name.split(" ")[0]}
          clientNumber={clientNumber}
          sentUpdates={sentUpdates ?? []}
          pronounPossessive={p.possessiveCapitalized}
        />
      </main>

      <ClientTabBar clientNumber={clientNumber} activeTab="comms" />
    </>
  );
}
