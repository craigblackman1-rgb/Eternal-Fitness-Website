import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { DBClient, DBBlock } from "@/types";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, profile, created_at")
    .order("created_at", { ascending: false });

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, client_id, block_number, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const totalClients = clients?.length ?? 0;
  const draftBlocks = blocks?.filter((b) => b.status === "draft").length ?? 0;
  const approvedBlocks = blocks?.filter((b) => b.status === "approved" || b.status === "active").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Esther</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{draftBlocks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active / Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{approvedBlocks}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clients && clients.length > 0 ? (
              <ul className="space-y-2">
                {clients.slice(0, 5).map((client) => (
                  <li key={client.id}>
                    <Link
                      href={`/hub/clients/${client.id}`}
                      className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
                    >
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(client.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No clients yet.{" "}
                <Link href="/hub/clients/new" className="text-accent hover:underline">
                  Add your first client
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            {blocks && blocks.length > 0 ? (
              <ul className="space-y-2">
                {blocks.map((block) => (
                  <li key={block.id}>
                    <Link
                      href={`/hub/clients/${block.client_id}/blocks/${block.id}`}
                      className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
                    >
                      <span className="font-medium">Block {block.block_number}</span>
                      <Badge
                        variant={
                          block.status === "approved" || block.status === "active"
                            ? "default"
                            : block.status === "draft"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {block.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No blocks generated yet. Create a client then generate a block.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
