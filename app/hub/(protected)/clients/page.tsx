import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
import type { DBClient } from "@/types";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: clients } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage client profiles and training blocks</p>
        </div>
        <Link href="/hub/clients/new">
          <Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const initials = client.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const sessionsPerWeek = client.profile?.logistics?.sessions_per_week;
            const timeTier = client.profile?.logistics?.time_tier;
            const conditions = client.profile?.health?.conditions;
            const goals = client.profile?.goals?.primary;

            return (
              <Link key={client.id} href={`/hub/clients/${client.id}`}>
                <Card className="transition-all duration-150 hover:shadow-md hover:border-rose/20 border-border/60 rounded-2xl group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-rose/15 text-rose flex items-center justify-center text-sm font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-rose transition-colors">{client.name}</h3>
                        <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                          {sessionsPerWeek && (
                            <p className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose/40" />
                              {sessionsPerWeek}x per week{timeTier ? ` · ${timeTier}` : ""}
                            </p>
                          )}
                          {conditions?.length > 0 && (
                            <p className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal/40" />
                              {conditions.length} condition(s)
                            </p>
                          )}
                          {goals && (
                            <p className="flex items-center gap-1.5 truncate" title={goals}>
                              <span className="w-1.5 h-1.5 rounded-full bg-dark-navy/30" />
                              {goals}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/60 rounded-2xl">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="w-20 h-20 rounded-full bg-rose/10 flex items-center justify-center">
              <Users className="w-9 h-9 text-rose/40" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">No clients yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first client to start building training blocks</p>
            </div>
            <Link href="/hub/clients/new">
              <Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
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
