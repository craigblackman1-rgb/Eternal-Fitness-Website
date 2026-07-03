import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconChevronLeft, IconMail, IconPlus, IconCalendar } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import type { SentUpdate } from "@/types";

export default async function UpdatesHistoryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const clientNumber = parseInt(params.id);

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("client_number", clientNumber)
    .single();

  if (!client) notFound();

  const { data: updates } = await supabase
    .from("sent_updates")
    .select("*")
    .eq("client_id", client.id)
    .order("sent_at", { ascending: false });

  const sentUpdates = (updates || []) as SentUpdate[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
<Link href={`/hub/clients/${params.id}`} className="text-muted-foreground hover:text-foreground">
           <IconChevronLeft className="h-5 w-5" />
         </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">6-Week Updates</h1>
          <p className="text-muted-foreground">{client.name}</p>
        </div>
        <Link href={`/hub/clients/${params.id}/updates/new`}>
<Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
             <IconPlus className="h-4 w-4" />
             New Update
           </Button>
        </Link>
      </div>

      {sentUpdates.length === 0 ? (
        <EmptyState
          icon={<IconMail className="h-6 w-6" />}
          title="No updates sent yet"
          description={`Generate a 6-week update from ${client.name}'s training data, review it, and send via email.`}
          cta={{ label: "Generate First Update", href: `/hub/clients/${params.id}/updates/new` }}
        />
      ) : (
        <div className="space-y-3">
          {sentUpdates.map((update) => (
            <Card key={update.id} className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                    <IconMail className="h-5 w-5 text-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{update.subject}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
<span className="flex items-center gap-1">
                         <IconCalendar className="h-3 w-3" />
                         {new Date(update.sent_at).toLocaleDateString("en-GB", {
                           day: "numeric",
                           month: "short",
                           year: "numeric",
                         })}
                      </span>
                      <Badge variant="outline" className="rounded-full text-xs">
                        Block {update.block_number}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
