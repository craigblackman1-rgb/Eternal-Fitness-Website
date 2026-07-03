import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconPlus, IconUsers } from "@/components/icons";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage client profiles and training blocks</p>
        </div>
        <Link href="/hub/clients/new">
          <Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
            <IconPlus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <ClientsTable clients={clients} />
      ) : (
        <div className="rounded-2xl border border-border/60 shadow-sm">
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
