import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HubCard, HubCardHeader } from "@/components/hub";
import { IconChevronLeft, IconFileText, IconTriangleAlert, IconPencil } from "@/components/icons";
import { parqSections } from "@/lib/parq-data";
import { diffParq } from "@/lib/parq-diff";
import type { SignedPARQ } from "@/types";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const DETAIL_FIELDS: { key: keyof SignedPARQ; label: string }[] = [
  { key: "full_name", label: "Full name" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "emergency_contact_name", label: "Emergency contact" },
  { key: "emergency_contact_phone", label: "Emergency phone" },
  { key: "gp_name", label: "GP name" },
  { key: "gp_surgery", label: "GP surgery" },
  { key: "gp_phone", label: "GP phone" },
];

const FREE_TEXT_FIELDS: { key: keyof SignedPARQ; label: string }[] = [
  { key: "conditions", label: "Conditions" },
  { key: "medications", label: "Medications" },
  { key: "devices", label: "Implanted devices" },
  { key: "surgeries", label: "Surgeries" },
  { key: "exercise_restrictions", label: "Exercise restrictions" },
  { key: "current_exercise", label: "Current exercise" },
  { key: "training_goals", label: "Training goals" },
  { key: "other_info", label: "Other information" },
];

/** Full read-only render of a submitted PAR-Q — every question and answer. */
function ParqDocument({ parq }: { parq: SignedPARQ }) {
  const details = DETAIL_FIELDS.filter((f) => parq[f.key]);
  const freeText = FREE_TEXT_FIELDS.filter((f) => parq[f.key]);

  return (
    <div className="space-y-6 text-sm">
      {/* Personal details */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Personal details</div>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {details.map((f) => (
            <div key={f.key} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <span className="text-sm text-foreground font-medium">
                {f.key === "date_of_birth" ? formatDate(parq[f.key] as string) : (parq[f.key] as string)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Questionnaire — every question + answer */}
      {parqSections.map((section) => (
        <div key={section.label}>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{section.label}</div>
          <div className="overflow-x-auto rounded-lg border border-[var(--hub-border)]">
            <ul className="divide-y divide-[var(--hub-border)]">
              {section.questions.map((q) => {
                const answer = parq[q.q as keyof SignedPARQ] as string;
                const isYes = answer === "yes";
                return (
                  <li key={q.q} className="flex items-start justify-between gap-3 px-3 py-1.5 bg-[var(--hub-canvas)]">
                    <span className="text-sm text-foreground flex items-start gap-2">
                      {isYes && <IconTriangleAlert className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />}
                      {q.text}
                    </span>
                    <Badge
                      variant={isYes ? "default" : "secondary"}
                      className={`rounded-full text-xs shrink-0 ${isYes ? "bg-[var(--status-warning-bg)] hover:bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]" : ""}`}
                    >
                      {answer ? answer.toUpperCase() : "—"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}

      {/* Free-text detail */}
      {freeText.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Details provided</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {freeText.map((f) => (
              <div key={f.key} className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-canvas)] p-3">
                <span className="text-xs text-muted-foreground block mb-1.5">{f.label}</span>
                <span className="text-sm text-foreground whitespace-pre-wrap">{parq[f.key] as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Declaration */}
      <div className="rounded-lg bg-[var(--hub-canvas)] border border-[var(--hub-border)] p-3">
        <span className="text-xs text-muted-foreground block mb-1.5">Declaration</span>
        <span className="text-sm text-foreground">
          Signed{parq.client_name_print ? ` by ${parq.client_name_print}` : ""} on{" "}
          {formatDate(parq.signed_at ?? parq.created_at)}
        </span>
      </div>
    </div>
  );
}

function DiffList({ diffs }: { diffs: { label: string; from: string; to: string }[] }) {
  if (diffs.length === 0) return <p className="text-sm text-muted-foreground">No changes from the previous submission.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {diffs.map((d, i) => (
        <li key={i}>
          <span className="text-xs text-muted-foreground block mb-0.5">{d.label}</span>
          <span className="text-foreground">
            <span className="line-through text-muted-foreground">{d.from}</span> → <span className="font-medium">{d.to}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function ParqHistoryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("id, name, client_number, email").eq("client_number", parseInt(params.id)).single();
  if (!client) notFound();

  const { data: submissions } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const rows = (submissions ?? []) as SignedPARQ[];
  // Current = most recent non-superseded; superseded rows are older versions.
  const active = rows.filter((r) => r.status !== "superseded");
  const latest = active[0] ?? rows[0] ?? null;
  const earlier = rows.filter((r) => r.id !== latest?.id);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/hub/clients/${client.client_number}?tab=compliance`} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md px-1 py-0.5 -ml-1 mb-3 transition-colors">
          <IconChevronLeft className="h-3.5 w-3.5" />
          Back to compliance
        </Link>
        <div className="flex items-start gap-3.5">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">PAR-Q (legacy record)</h1>
            <p className="text-muted-foreground text-sm mt-1">{client.name}</p>
          </div>
          {latest && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/hub/clients/${client.client_number}/parq/${latest.id}/edit`}
                className="inline-flex items-center gap-1.5"
              >
                <Button variant="outline" className="border border-[var(--color-muted-text)] rounded-lg px-3.5 py-1.5 h-auto text-sm font-medium hover:bg-[var(--hub-hover)] gap-1.5">
                  <IconPencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          New and updated PAR-Qs are now sent from the client&apos;s{" "}
          <Link href={`/hub/clients/${client.client_number}/documents`} className="text-teal font-medium hover:underline">
            Documents
          </Link>{" "}
          tab — this page shows the pre-migration record for reference.
        </p>
      </div>

      {!latest ? (
        <HubCard>
          <div className="py-8 text-center text-muted-foreground">No PAR-Q on file for this client.</div>
        </HubCard>
      ) : (
        <>
          <HubCard>
            <HubCardHeader
              icon={<IconFileText className="w-4 h-4" />}
              title={`Submitted ${formatDate(latest.created_at)}${latest.version > 1 ? ` (v${latest.version})` : ""}`}
              color="teal"
              noBottomPadding={false}
              divider
            />
            <div className="pt-4">
              <ParqDocument parq={latest} />
            </div>
          </HubCard>

          {earlier.length > 0 && (
            <HubCard>
              <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Earlier submissions" color="slate" noBottomPadding={false} divider />
              <div className="pt-4 space-y-2">
                {[latest, ...earlier].slice(0, -1).map((newer, i) => {
                  const older = [latest, ...earlier][i + 1];
                  return (
                    <details key={older.id} className="rounded-lg border border-[var(--hub-border)] px-4 py-2.5 group">
                      <summary className="cursor-pointer text-sm font-medium text-foreground flex items-center justify-between">
                        <span>
                          {formatDate(older.created_at)}{older.version ? ` (v${older.version})` : ""} → {formatDate(newer.created_at)}{newer.version ? ` (v${newer.version})` : ""}
                          {older.status === "superseded" && (
                            <Badge variant="secondary" className="ml-2 rounded-full text-xs">superseded</Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground group-open:hidden">Show changes</span>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-[var(--hub-border)]">
                        <DiffList diffs={diffParq(older, newer)} />
                      </div>
                    </details>
                  );
                })}
              </div>
            </HubCard>
          )}
        </>
      )}
    </div>
  );
}
