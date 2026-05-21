import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileText, Pencil, Plus } from "lucide-react";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", params.id).single();
  const { data: blocks } = await supabase.from("blocks").select("*").eq("client_id", params.id).order("block_number", { ascending: false });

  if (!client) notFound();

  const p = client.profile;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hub/clients" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">
            {p?.client?.age && `${p.client.age} yrs`} {p?.client?.gender && `· ${p.client.gender}`}
            {p?.logistics?.sessions_per_week && ` · ${p.logistics.sessions_per_week}x/week`}
            {p?.logistics?.time_tier && ` · ${p.logistics.time_tier}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/hub/clients/${params.id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/hub/clients/${params.id}/blocks/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Block
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <Link
                      key={block.id}
                      href={`/hub/clients/${params.id}/blocks/${block.id}`}
                      className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Block {block.block_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(block.created_at).toLocaleDateString()}
                            {block.block_note && ` · ${block.block_note.slice(0, 60)}${block.block_note.length > 60 ? "..." : ""}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={block.status === "approved" || block.status === "active" ? "default" : block.status === "draft" ? "secondary" : "outline"} className="capitalize">
                        {block.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm text-muted-foreground">No blocks yet</p>
                  <Link href={`/hub/clients/${params.id}/blocks/new`}>
                    <Button variant="outline" size="sm">
                      Generate First Block
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {p?.health && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">GP Clearance:</span>
                  <Badge variant={p.health.gp_clearance ? "default" : "destructive"}>
                    {p.health.gp_clearance ? "Yes" : "No"}
                  </Badge>
                </div>
                {p.health.conditions?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Conditions:</span>
                    <p>{p.health.conditions.join(", ")}</p>
                  </div>
                )}
                {p.health.contraindications?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Contraindications:</span>
                    <p>{p.health.contraindications.join(", ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {p?.goals && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Primary:</span> {p.goals.primary}</p>
                {p.goals.milestones?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Milestones:</span>
                    <ul className="list-inside list-disc">
                      {p.goals.milestones.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {p?.notes?.esther_observations && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{p.notes.esther_observations}</p>
                {p.notes.watch_for && (
                  <p className="mt-2"><span className="text-destructive font-medium">Watch for:</span> {p.notes.watch_for}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
