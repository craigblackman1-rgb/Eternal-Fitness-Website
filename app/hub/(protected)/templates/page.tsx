import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { IconFileText, IconFileSignature } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { HubCard } from "@/components/hub/HubCard";
import { StatusBadge } from "@/components/hub/StatusBadge";
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
        <HubCard>
          <EmptyState
            icon={<IconFileText className="h-6 w-6" />}
            title="No templates yet"
            description="Templates are seeded via the document engine. Once available they appear here for editing."
          />
        </HubCard>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/hub/templates/${t.id}`} className="block">
              <div className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm hover:border-rose/40 transition p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-rose/10 flex items-center justify-center shrink-0">
                    <IconFileSignature className="h-5 w-5 text-rose" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{t.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{DOCUMENT_KIND_LABEL[t.kind as DocumentKind] ?? t.kind}</span>
                      <span className="text-[var(--hub-border)]">·</span>
                      <span>{t.body?.sections?.length ?? 0} sections</span>
                      {t.requires_trainer_signature && (
                        <>
                          <span className="text-[var(--hub-border)]">·</span>
                          <span>Dual-signed</span>
                        </>
                      )}
                      <span className="text-[var(--hub-border)]">·</span>
                      <span>v{t.version}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={t.is_active ? "active" : "draft"} className="shrink-0" />
              </div>
            </Link>
          ))}

          {/* PAR-Q — a structured questionnaire, managed as its own form rather than an editable template */}
          <Link href="/parq" className="block">
            <div className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm hover:border-teal/40 transition p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                  <IconFileText className="h-5 w-5 text-teal" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">PAR-Q</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>Health questionnaire</span>
                    <span className="text-[var(--hub-border)]">·</span>
                    <span>Client-signed</span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full border border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--status-neutral)] shrink-0">Form</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
