import { createClient } from "@/lib/supabase-server";
import type { ClientProfile } from "@/types";
import { ClientEditScreen } from "./ClientEditScreen";

interface ClientRow {
  id: string;
  name: string;
  client_number: number;
  email: string | null;
  phone: string | null;
  profile: ClientProfile | null;
}

export default async function MobileClientEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const clientNumber = parseInt(params.id);
  if (!Number.isFinite(clientNumber)) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, client_number, email, phone, profile")
    .eq("client_number", clientNumber)
    .single();

  if (!client) return null;

  const c = client as ClientRow;

  return (
    <ClientEditScreen
      clientNumber={c.client_number}
      name={c.name}
      email={c.email ?? ""}
      phone={c.phone ?? ""}
      emergencyContact={c.profile?.emergency_contact ?? null}
      conditions={c.profile?.health?.conditions ?? []}
      medications={c.profile?.health?.medications ?? []}
      fullProfile={(c.profile ?? {}) as Record<string, unknown>}
    />
  );
}
