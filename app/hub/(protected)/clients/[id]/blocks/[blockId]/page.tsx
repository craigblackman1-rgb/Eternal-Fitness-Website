import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Eye, Printer, FileText } from "lucide-react";
import { DeleteBlockButton } from "./delete-block-button";
import { ExportSpreadsheetButton } from "./export-spreadsheet";

// Phase colors — brand-consistent (rose, teal, slate, navy, off-white)
const phaseColors: Record<string, string> = {
  foundation: "bg-teal/10 text-teal",
  build: "bg-rose/10 text-rose",
  develop: "bg-dark-navy/10 text-dark-navy",
  peak: "bg-rose text-white",
  deload: "bg-slate/10 text-slate",
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
    .select("name, client_number")
    .eq("client_number", parseInt(params.id))
    .single();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("block_id", params.blockId)
    .order("session_number", { ascending: true });

  const initials = (client?.name || "C").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${client?.client_number || params.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-rose" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Block {block.block_number}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{client?.name || "Client"}</span>
              <span>·</span>
              <span>Created {new Date(block.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              <Badge className="capitalize rounded-full">{block.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/hub/clients/${client?.client_number || params.id}/blocks/${params.blockId}/print`}>
            <Button variant="outline" className="rounded-full gap-1.5 border-border/60">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </Link>
          {block.status === "draft" && (
            <Link href={`/hub/clients/${client?.client_number || params.id}/blocks/${params.blockId}/review`}>
              <Button className="rounded-full bg-rose hover:bg-rose/90 text-white">Review & Approve</Button>
            </Link>
          )}
          <ExportSpreadsheetButton
            blockId={params.blockId}
            blockNumber={block.block_number}
            clientName={client?.name || "Client"}
          />
          <DeleteBlockButton clientId={client?.client_number || params.id} blockId={params.blockId} />
        </div>
      </div>

      {/* Block Note */}
      {block.block_note && (
        <Card className="shadow-sm border-border/60 rounded-2xl bg-off-white/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Block Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{block.block_note}</p>
          </CardContent>
        </Card>
      )}

      {/* Sessions Table */}
      <Card className="shadow-sm border-border/60 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
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
                <TableRow key={session.id} className="border-border/60">
                  <TableCell className="font-semibold text-foreground">{session.session_number}</TableCell>
                  <TableCell>
                    <Badge
                      variant={session.archetype === "A" ? "secondary" : session.archetype === "B" ? "default" : "outline"}
                      className="rounded-full font-mono"
                    >
                      {session.archetype}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">Week {session.week}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${phaseColors[session.phase] || "bg-muted text-muted-foreground"}`}>
                      {session.phase}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {session.data?.focus_label || session.data?.client_intro || "—"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/hub/clients/${client?.client_number || params.id}/blocks/${params.blockId}/sessions/${session.session_number}`}>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-rose/10 hover:text-rose">
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
