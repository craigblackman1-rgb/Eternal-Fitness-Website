import { getPortalSessionFromCookies } from "@/lib/portal-session";
import { createPortalDataClient } from "@/lib/portal-data";
import { HubCard, HubCardHeader } from "@/components/hub";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { EmptyState } from "@/components/hub/EmptyState";
import { IconFileText, IconClock, IconMail, IconCheckCircle, IconAlertTriangle } from "@/components/icons";
import { formatUpdateTime } from "@/lib/updates/status";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Human-readable document kind labels.
const KIND_LABELS: Record<string, string> = {
  terms: "Terms & Conditions",
  risk_assessment: "Risk Assessment",
  annual_review: "Annual Review",
  parq: "PAR-Q",
};

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PortalDashboardPage() {
  const session = await getPortalSessionFromCookies();
  if (!session) return null; // layout already redirects; guard for types.

  const data = createPortalDataClient(session.clientId);
  const [signed, outstanding, updates] = await Promise.all([
    data.getSignedDocuments(),
    data.getOutstandingDocuments(),
    data.getUpdateHistory(),
  ]);

  return (
    <div className="space-y-10">
      <section aria-labelledby="portal-welcome">
        <h1 id="portal-welcome" className="text-2xl font-semibold tracking-tight">
          Your documents &amp; updates
        </h1>
        <p className="mt-1 text-muted-foreground">
          A read-only view of what you&rsquo;ve signed, what&rsquo;s still outstanding, and the
          updates Eternal Fitness has sent you.
        </p>
      </section>

      {/* Signed documents ------------------------------------------------ */}
      <section aria-labelledby="portal-signed">
        <HubCard>
          <HubCardHeader
            icon={<IconCheckCircle className="w-5 h-5 text-[var(--status-success)]" aria-hidden="true" />}
            title="Signed documents"
            subtitle={`${signed.length} document${signed.length === 1 ? "" : "s"} on file`}
            color="teal"
          />
          {signed.length === 0 ? (
            <EmptyState
              icon={<IconFileText className="w-7 h-7" />}
              title="No signed documents yet"
              description="Once you've signed a document, it will appear here."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {signed.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-medium">{doc.title || kindLabel(doc.kind)}</p>
                    <p className="text-sm text-muted-foreground">
                      {kindLabel(doc.kind)}
                      {doc.version > 1 ? ` · v${doc.version}` : ""} · Signed{" "}
                      {formatDate(doc.client_signed_date || doc.signed_at)}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </li>
              ))}
            </ul>
          )}
        </HubCard>
      </section>

      {/* Outstanding / unsigned documents ------------------------------- */}
      <section aria-labelledby="portal-outstanding">
        <HubCard>
          <HubCardHeader
            icon={<IconAlertTriangle className="w-5 h-5 text-[var(--status-warning)]" aria-hidden="true" />}
            title="Outstanding documents"
            subtitle={`${outstanding.length} awaiting signature or attention`}
            color="teal"
          />
          {outstanding.length === 0 ? (
            <EmptyState
              icon={<IconCheckCircle className="w-7 h-7" />}
              title="All caught up"
              description="You have no documents waiting on your signature right now."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {outstanding.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-medium">{doc.title || kindLabel(doc.kind)}</p>
                    <p className="text-sm text-muted-foreground">
                      {kindLabel(doc.kind)}
                      {doc.version > 1 ? ` · v${doc.version}` : ""}
                      {doc.sent_at ? ` · Sent ${formatDate(doc.sent_at)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </li>
              ))}
            </ul>
          )}
        </HubCard>
      </section>

      {/* Update-email history ------------------------------------------- */}
      <section aria-labelledby="portal-updates">
        <HubCard>
          <HubCardHeader
            icon={<IconMail className="w-5 h-5 text-[var(--status-primary)]" aria-hidden="true" />}
            title="Update email history"
            subtitle={`${updates.length} email${updates.length === 1 ? "" : "s"} sent`}
            color="teal"
          />
          {updates.length === 0 ? (
            <EmptyState
              icon={<IconMail className="w-7 h-7" />}
              title="No updates sent yet"
              description="When Eternal Fitness sends you a progress update, it will appear here."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {updates.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-medium">{u.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {u.block_number > 0 ? `Block ${u.block_number} · ` : ""}
                      {formatUpdateTime(u.sent_at)}
                      {u.opened_at ? " · Opened" : " · Not opened"}
                    </p>
                  </div>
                  <StatusBadge status={u.status} />
                </li>
              ))}
            </ul>
          )}
        </HubCard>
      </section>
    </div>
  );
}
