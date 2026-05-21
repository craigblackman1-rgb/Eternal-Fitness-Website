import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type { DBClient } from "@/types";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: clients } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage client profiles and training blocks</p>
        </div>
        <Link href="/hub/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/hub/clients/${client.id}`}>
              <Card className="transition-colors hover:bg-white/50">
                <CardHeader>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  {client.profile?.logistics && (
                    <>
                      <p>{client.profile.logistics.sessions_per_week}x / week</p>
                      <p>{client.profile.logistics.time_tier}</p>
                    </>
                  )}
                  {client.profile?.health?.conditions?.length > 0 && (
                    <p className="truncate" title={client.profile.health.conditions.join(", ")}>
                      {client.profile.health.conditions.length} condition(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">No clients yet</p>
            <Link href="/hub/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
