import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { HubCardHeader } from "@/components/hub/HubCardHeader";
import { IconChevronLeft, IconFileText, IconTriangleAlert } from "@/components/icons";
import { questionTextMap } from "@/lib/parq-data";
import { diffParq } from "@/lib/parq-diff";
import type { SignedPARQ } from "@/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const FREE_TEXT_FIELDS: { key: keyof SignedPARQ; label: string }[] = [
  { key: "conditions", label: "Conditions" },
  { key: "medications", label: "Medications" },
  { key: "devices", label: "Devices" },
  { key: "exercise_restrictions", label: "Exercise restrictions" },
  { key: "surgeries", label: "Surgeries" },
  { key: "other_info", label: "Other info" },
];

function SubmissionSummary({ parq }: { parq: SignedPARQ }) {
  const flagged = Object.entries(questionTextMap).filter(([q]) => parq[q as keyof SignedPARQ] === "yes");
  const freeText = FREE_TEXT_FIELDS.filter((f) => parq[f.key]);

  return (
    <div className="space-y-3 text-sm">
      {flagged.length > 0 ? (
        <ul className="space-y-1.5">
          {flagged.map(([q, text]) => (
            <li key={q} className="flex items-start gap-2">
              <IconTriangleAlert className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-foreground">{text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No risk factors flagged.</p>
      )}
      {freeText.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 pt-1">
          {freeText.map((f) => (
            <div key={f.key}>
              <span className="text-xs text-muted-foreground block mb-0.5">{f.label}</span>
              <span className="text-foreground">{parq[f.key]}</span>
            </div>
          ))}
        </div>
      )}
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
  const { data: client } = await supabase.from("clients").select("id, name, client_number").eq("client_number", parseInt(params.id)).single();
  if (!client) notFound();

  const { data: submissions } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const rows = submissions ?? [];
  const [latest, ...earlier] = rows;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${client.client_number}?tab=profile-compliance`} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">PAR-Q History</h1>
          <p className="text-muted-foreground">{client.name}</p>
        </div>
      </div>

      {!latest ? (
        <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
          <CardContent className="py-8 text-center text-muted-foreground">No PAR-Q on file for this client.</CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
            <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title={`Current submission — ${formatDate(latest.created_at)}`} color="teal" />
            <CardContent className="pt-0">
              <SubmissionSummary parq={latest} />
            </CardContent>
          </Card>

          {earlier.length > 0 && (
            <Card className="bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)] shadow-sm">
              <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Earlier submissions" color="slate" />
              <CardContent className="pt-0 space-y-2">
                {[latest, ...earlier].slice(0, -1).map((newer, i) => {
                  const older = [latest, ...earlier][i + 1];
                  return (
                    <details key={older.id} className="rounded-lg border border-[var(--hub-border)] px-4 py-2.5 group">
                      <summary className="cursor-pointer text-sm font-medium text-foreground flex items-center justify-between">
                        <span>{formatDate(older.created_at)} → {formatDate(newer.created_at)}</span>
                        <span className="text-xs text-muted-foreground group-open:hidden">Show changes</span>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-[var(--hub-border)]">
                        <DiffList diffs={diffParq(older, newer)} />
                      </div>
                    </details>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
