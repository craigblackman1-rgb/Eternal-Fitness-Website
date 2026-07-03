import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconPlus, IconUsers } from "@/components/icons";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { EmptyState } from "@/components/hub/EmptyState";
import { HubTable, type HubColumn } from "@/components/hub/HubTable";
import type { DBClient } from "@/types";

function InitialsCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClasses} rounded-full bg-rose/15 text-rose flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function getGoalsLabel(goals: DBClient["profile"]["goals"]["primary"] | undefined): string {
  if (!goals) return "—";
  const labels: Record<string, string> = {
    strength: "Strength",
    mobility: "Mobility",
    weight_loss: "Weight Loss",
    rehabilitation: "Rehab",
    confidence: "Confidence",
    general_fitness: "General Fitness",
  };
  return labels[goals] ?? goals;
}

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*, compliance_status, outstanding_actions, group_type, pace_mode")
    .order("created_at", { ascending: false });

  const columns: HubColumn<DBClient>[] = [
    {
      key: "name",
      header: "Client",
      sortable: true,
      render: (client) => (
        <div className="flex items-center gap-3">
          <InitialsCircle name={client.name} />
          <span className="font-semibold text-foreground truncate">{client.name}</span>
        </div>
      ),
    },
    {
      key: "sessions_per_week",
      header: "Sessions / Week",
      render: (client) => {
        const spw = client.profile?.logistics?.sessions_per_week;
        return spw ? `${spw}x` : "—";
      },
    },
    {
      key: "conditions",
      header: "Conditions",
      render: (client) => {
        const count = client.profile?.health?.conditions?.length ?? 0;
        return count > 0 ? String(count) : "—";
      },
      sortValue: (client) => client.profile?.health?.conditions?.length ?? 0,
    },
    {
      key: "goals",
      header: "Goals",
      render: (client) => (
        <span className="truncate block max-w-32" title={client.profile?.goals?.primary ?? ""}>
          {getGoalsLabel(client.profile?.goals?.primary)}
        </span>
      ),
    },
    {
      key: "compliance_status",
      header: "Compliance",
      render: (client) =>
        client.compliance_status ? (
          <StatusBadge status={client.compliance_status} />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      sortValue: (client) => client.compliance_status ?? "",
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      className: "text-muted-foreground whitespace-nowrap",
      render: (client) =>
        new Date(client.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
  ];

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
        <HubTable
          data={clients}
          columns={columns}
          getRowHref={(client) => `/hub/clients/${client.client_number}`}
          searchPlaceholder="Search clients by name..."
          searchKeys={["name"]}
          emptyState={
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No clients match your search.</p>
            </div>
          }
        />
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
