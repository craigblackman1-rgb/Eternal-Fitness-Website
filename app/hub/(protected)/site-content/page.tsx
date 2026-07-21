import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SiteContentTable } from "./site-content-table";
import { HubPageHeader } from "@/components/hub";

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
        subtitle="Manage SEO keywords and editable content blocks for each page"
      />
      <SiteContentTable keywords={keywords ?? []} />
    </div>
  );
}
