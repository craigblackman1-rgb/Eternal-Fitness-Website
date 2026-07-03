"use client";

import { StatusBadge } from "@/components/hub/StatusBadge";
import { HubTable, type HubColumn } from "@/components/hub/HubTable";
import type { DBClient } from "@/types";

function InitialsCircle({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-full bg-rose/15 text-rose flex items-center justify-center text-sm font-bold shrink-0">
      {initials}
    </div>
  );
}

function getGoalsLabel(goals: string | undefined): string {
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

export function ClientsTable({ clients }: { clients: DBClient[] }) {
  return (
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
  );
}
