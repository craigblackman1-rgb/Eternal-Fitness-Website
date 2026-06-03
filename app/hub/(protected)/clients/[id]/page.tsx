import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileText, Pencil, Plus, Heart, Target, ClipboardList } from "lucide-react";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("client_number", parseInt(params.id)).single();
  const { data: blocks } = await supabase.from("blocks").select("*").eq("client_id", params.id).order("block_number", { ascending: false });

  if (!client) notFound();

  const p = client.profile;
  const initials = client.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header — client identity */}
      <div className="flex items-center gap-4">
        <Link href="/hub/clients" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-rose/15 text-rose flex items-center justify-center text-lg font-bold shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">
              {p?.client?.age && `${p.client.age} yrs`} {p?.client?.gender && `· ${p.client.gender}`}
              {p?.logistics?.sessions_per_week && ` · ${p.logistics.sessions_per_week}x/week`}
              {p?.logistics?.time_tier && ` · ${p.logistics.time_tier}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/hub/clients/${client.client_number}/edit`}>
            <Button variant="outline" className="rounded-full gap-1.5 border-border/60">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
                  <Link href={`/hub/clients/${client.client_number}/blocks/new`}>
            <Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
              <Plus className="h-4 w-4" />
              New Block
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Training Blocks — main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-rose" />
                </div>
                Training Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <Link
                      key={block.id}
                      href={`/hub/clients/${client.client_number}/blocks/${block.id}`}
                      className="flex items-center justify-between rounded-xl border border-border/60 p-4 transition-all hover:bg-off-white hover:border-rose/20 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-off-white flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground group-hover:text-rose transition-colors" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Block {block.block_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(block.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {block.block_note && ` · ${block.block_note.slice(0, 60)}${block.block_note.length > 60 ? "..." : ""}`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={block.status === "approved" || block.status === "active" ? "default" : block.status === "draft" ? "secondary" : "outline"}
                        className="capitalize rounded-full"
                      >
                        {block.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-rose/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No blocks yet</p>
          <Link href={`/hub/clients/${client.client_number}/blocks/new`}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      Generate First Block
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — Health, Goals, Notes */}
        <div className="space-y-6">
          {p?.health && (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal/10 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-teal" />
                  </div>
                  Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">GP Clearance</span>
                  <Badge variant={p.health.gp_clearance ? "default" : "destructive"} className="rounded-full">
                    {p.health.gp_clearance ? "Yes" : "No"}
                  </Badge>
                </div>
                {p.health.conditions?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Conditions</span>
                    <p className="text-foreground">{p.health.conditions.join(", ")}</p>
                  </div>
                )}
                {p.health.contraindications?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Contraindications</span>
                    <p className="text-foreground">{p.health.contraindications.join(", ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {p?.goals && (
            <Card className="shadow-sm border-border/60 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-dark-navy/10 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-dark-navy" />
                  </div>
                  Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Primary</span>
                  <p className="text-foreground font-medium">{p.goals.primary}</p>
                </div>
                {p.goals.milestones?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Milestones</span>
                    <ul className="list-none space-y-1">
                      {p.goals.milestones.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose/50 mt-1.5 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {p?.notes?.esther_observations && (
            <Card className="shadow-sm border-border/60 rounded-2xl bg-off-white/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate/10 flex items-center justify-center">
                    <ClipboardList className="w-3.5 h-3.5 text-slate" />
                  </div>
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-foreground">{p.notes.esther_observations}</p>
                {p.notes.watch_for && (
                  <div className="mt-3 p-3 rounded-lg bg-rose/5 border border-rose/10">
                    <span className="text-rose font-semibold text-xs uppercase tracking-wide">Watch for</span>
                    <p className="text-rose/80 mt-1">{p.notes.watch_for}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
