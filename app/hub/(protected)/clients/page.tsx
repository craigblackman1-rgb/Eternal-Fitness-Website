import { createClient } from "@/lib/supabase-server";
import { IconUsers } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { ClientsTable } from "./clients-table";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*, compliance_status, outstanding_actions, group_type, pace_mode")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage client profiles and training blocks</p>
      </div>

      {clients && clients.length > 0 ? (
        <ClientsTable clients={clients} />
      ) : (
        <div className="rounded-2xl border border-[var(--hub-border)] shadow-sm bg-[var(--hub-card)]">
          <EmptyState
            icon={<IconUsers className="w-9 h-9" />}
            title="No clients yet"
            description="Add your first client to start building training blocks"
            cta={{ label: "Add Your First Client", href: "/hub/clients/new" }}
          />
        </div>
      )}
    </div>
  );
}
