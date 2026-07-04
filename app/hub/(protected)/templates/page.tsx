import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconFileText, IconFileSignature } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { DOCUMENT_KIND_LABEL, type DocumentTemplate, type DocumentKind } from "@/lib/documents/types";

export default async function TemplatesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("document_templates")
    .select("*")
    .order("kind", { ascending: true });
  const templates = (data || []) as DocumentTemplate[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Document Templates</h1>
        <p className="text-muted-foreground">
          The master copies used to create client documents. Edit the wording here — changes apply to documents created from now on.
        </p>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<IconFileText className="h-6 w-6" />}
          title="No templates yet"
          description="Templates are seeded via the document engine. Once available they appear here for editing."
        />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/hub/templates/${t.id}`}>
              <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] hover:border-rose/40 transition">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center shrink-0">
                      <IconFileSignature className="h-5 w-5 text-rose" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{DOCUMENT_KIND_LABEL[t.kind as DocumentKind] ?? t.kind}</span>
                        <span>{t.body?.sections?.length ?? 0} sections</span>
                        <Badge variant="outline" className="rounded-full text-xs">v{t.version}</Badge>
                        {t.requires_trainer_signature && <Badge variant="outline" className="rounded-full text-xs">Dual-signed</Badge>}
                      </div>
                    </div>
                  </div>
                  <Badge variant={t.is_active ? "default" : "secondary"} className="rounded-full text-xs">
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* PAR-Q — a structured questionnaire, managed as its own form rather than an editable template */}
          <Link href="/parq">
            <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] hover:border-rose/40 transition">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                    <IconFileText className="h-5 w-5 text-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">PAR-Q</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>Health questionnaire · client-signed</span>
                      <Badge variant="outline" className="rounded-full text-xs">Sent per client</Badge>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="rounded-full text-xs">Form</Badge>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
