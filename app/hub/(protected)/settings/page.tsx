import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HubPageHeader, HubCard } from "@/components/hub";
import { getPool } from "@/lib/pg-client";

export const dynamic = "force-dynamic";

interface CardStat {
  stat?: string;
  pill?: { label: string; tone?: "success" | "warning" | "danger" | "neutral" };
}

function StatPill({ label, tone = "neutral" }: { label: string; tone?: "success" | "warning" | "danger" | "neutral" }) {
  const tones: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center rounded-pill border px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function fetchCardStats(): Promise<Record<string, CardStat>> {
  try {
    const supabase = createClient();
    const pool = getPool();

    const [
      trainingRuleTypes,
      studioEquipment,
      bandSets,
      planAgentSettings,
      integrationTokens,
      latestSync,
      processEntries,
      sops,
      pageKeywords,
    ] = await Promise.all([
      supabase.from("training_rule_types").select("id", { count: "exact", head: true }),
      supabase.from("studio_equipment").select("*"),
      pool.query("SELECT count(*)::int AS cnt FROM band_sets"),
      supabase.from("plan_agent_settings").select("id", { count: "exact", head: true }),
      supabase.from("integration_tokens").select("calendar_id, account_email").eq("provider", "microsoft").maybeSingle(),
      pool.query("SELECT max(synced_at) AS last_sync FROM session_calendar_events"),
      supabase.from("process_entries").select("id", { count: "exact", head: true }),
      supabase.from("sops").select("id", { count: "exact", head: true }),
      supabase.from("page_keywords").select("id", { count: "exact", head: true }),
    ]);

    const equipment = (studioEquipment.data ?? []) as Array<{ active: boolean }>;
    const activeCount = equipment.filter((e) => e.active).length;
    const bandSetCount = bandSets.rows[0]?.cnt ?? 0;
    const connected = !!integrationTokens.data?.calendar_id;
    const lastSync = latestSync.rows[0]?.last_sync as string | null;

    return {
      "training-rules": {
        stat: trainingRuleTypes.count !== null ? `${trainingRuleTypes.count} rule types` : undefined,
      },
      "studio-equipment": {
        stat: `${equipment.length} items · ${activeCount} active`,
        pill: bandSetCount > 0 ? { label: `${bandSetCount} band sets`, tone: "neutral" } : undefined,
      },
      "plan-agent": {
        stat: planAgentSettings.count !== null ? `${planAgentSettings.count} rules/principles configured` : undefined,
      },
      integrations: {
        stat: connected ? "Connected" : "Not connected",
        pill: connected
          ? { label: lastSync ? `last sync ${formatRelativeTime(lastSync)}` : "connected", tone: "success" }
          : { label: "not connected", tone: "warning" },
      },
      "process-quality": {
        stat: `${processEntries.count ?? 0} processes · ${sops.count ?? 0} SOPs`,
      },
      "web-admin": {
        stat: pageKeywords.count !== null ? `${pageKeywords.count} pages` : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function SettingsIndexPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  const stats = await fetchCardStats();

  const settingsLinks: Array<{
    href: string;
    label: string;
    description: string;
    key: string;
  }> = [
    { href: "/hub/settings/training-rules", label: "Training rules", description: "Rule types for structured programming rules on each client.", key: "training-rules" },
    { href: "/hub/settings/studio-equipment", label: "Studio equipment", description: "Equipment the Plan Agent can programme from.", key: "studio-equipment" },
    { href: "/hub/settings/plan-agent", label: "Plan agent rules", description: "Principles and safety rules the Plan Agent follows.", key: "plan-agent" },
    { href: "/hub/settings/integrations", label: "Integrations", description: "Connect the studio calendar for Outlook sync.", key: "integrations" },
    { href: "/hub/process-quality", label: "Process & Quality", description: "Studio processes, SOPs, and the improvement log.", key: "process-quality" },
    { href: "/hub/web-admin", label: "Web admin", description: "Marketing site pages — what's live, hidden, or to write.", key: "web-admin" },
  ];

  return (
    <div className="space-y-6">
      <HubPageHeader
        title="Settings"
        subtitle="Studio configuration — rules, equipment, the Plan Agent, integrations and admin tools."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((link) => {
          const s = stats[link.key];
          return (
            <Link key={link.href} href={link.href} className="contents">
              <HubCard className="hover:border-rose/40 transition-colors cursor-pointer">
                <h3 className="text-sm font-bold text-foreground">{link.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                {s?.stat && (
                  <p className="text-xs text-muted-foreground mt-2 font-medium">{s.stat}</p>
                )}
                {s?.pill && (
                  <div className="mt-1.5">
                    <StatPill label={s.pill.label} tone={s.pill.tone} />
                  </div>
                )}
              </HubCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
