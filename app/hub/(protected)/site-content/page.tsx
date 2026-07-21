import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SiteContentTable } from "./site-content-table";
import { HubPageHeader } from "@/components/hub";
import { IconRefreshCw } from "@/components/icons";

export default async function SiteContentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  const { data: keywords } = await supabase
    .from("page_keywords")
    .select("*")
    .order("page_slug");

  return (
    <div className="space-y-6">
      <HubPageHeader
        title="Site Content"
        subtitle="Every page on the site — published, needs writing, or needs updating"
        actions={
          <button
            type="button"
            title="Coming soon — will auto-detect new/removed pages"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hub-field-border)] bg-[var(--hub-card)] px-3.5 py-2 text-sm font-medium text-foreground hover:border-[var(--hub-field-border-hover)] transition-colors"
          >
            <IconRefreshCw className="h-4 w-4" />
            Rescan pages
          </button>
        }
      />
      <SiteContentTable keywords={keywords ?? []} />
    </div>
  );
}
