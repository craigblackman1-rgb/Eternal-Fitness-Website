import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Eye, Printer } from "lucide-react";
import { DeleteBlockButton } from "./delete-block-button";

const phaseColors: Record<string, string> = {
  foundation: "bg-blue-100 text-blue-800",
  build: "bg-amber-100 text-amber-800",
  develop: "bg-purple-100 text-purple-800",
  peak: "bg-rose-100 text-rose-800",
  deload: "bg-slate-100 text-slate-800",
};

export default async function BlockViewPage({
  params,
}: {
  params: { id: string; blockId: string };
}) {
  const supabase = createClient();

  const { data: block } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", params.blockId)
    .single();

  if (!block) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", params.id)
    .single();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("block_id", params.blockId)
    .order("session_number", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${params.id}`} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Block {block.block_number} — {client?.name || "Client"}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Created {new Date(block.created_at).toLocaleDateString()}</span>
            <Badge className="capitalize">{block.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/hub/clients/${params.id}/blocks/${params.blockId}/print`}>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </Link>
          {block.status === "draft" && (
            <Link href={`/hub/clients/${params.id}/blocks/${params.blockId}/review`}>
              <Button>Review & Approve</Button>
            </Link>
          )}
          <DeleteBlockButton clientId={params.id} blockId={params.blockId} />
        </div>
      </div>

      {block.block_note && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Block Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{block.block_note}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Archetype</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Focus</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.session_number}</TableCell>
                  <TableCell>
                    <Badge variant={session.archetype === "A" ? "secondary" : session.archetype === "B" ? "default" : "outline"}>
                      {session.archetype}
                    </Badge>
                  </TableCell>
                  <TableCell>{session.week}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${phaseColors[session.phase] || ""}`}>
                      {session.phase}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {session.data?.focus_label || session.data?.client_intro}
                  </TableCell>
                  <TableCell>
                    <Link href={`/hub/clients/${params.id}/blocks/${params.blockId}/sessions/${session.session_number}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
