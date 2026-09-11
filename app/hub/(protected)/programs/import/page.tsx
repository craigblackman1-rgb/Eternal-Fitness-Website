import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ProgramImportClient } from "./ProgramImportClient";

export default async function ProgramImportPage({
  searchParams,
}: {
  searchParams: { client?: string; from?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  let clientNumber: number | undefined;
  let clientName: string | undefined;

  if (searchParams.client) {
    const num = Number(searchParams.client);
    if (!isNaN(num)) {
      clientNumber = num;
      const { data: client } = await supabase
        .from("clients")
        .select("name")
        .eq("client_number", num)
        .single();
      if (client?.name) clientName = client.name;
    }
  }

  return (
    <ProgramImportClient
      clientNumber={clientNumber}
      clientName={clientName}
      from={searchParams.from}
    />
  );
}
