import { notFound } from "next/navigation";
import ParqEditClient from "./ParqEditClient";
import { createAdminClient } from "@/lib/supabase-admin";

export default async function ParqEditPage({ params }: { params: { id: string } }) {
  // Public page: the client opens this via an unguessable-UUID link to update
  // their own PAR-Q. They're not logged in, so RLS would hide the row — load it
  // with the service-role client, scoped to the single id in the URL.
  const supabase = createAdminClient();

  const { data: parq } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!parq) {
    notFound();
  }

  return <ParqEditClient parq={parq} />;
}
