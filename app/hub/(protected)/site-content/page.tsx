import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SiteContentTable } from "./site-content-table";

export default async function SiteContentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  const { data: keywords } = await supabase
    .from("page_keywords")
    .select("*")
    .order("page_slug");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Site Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage SEO keywords and editable content blocks for each page.
        </p>
      </div>
      <SiteContentTable keywords={keywords ?? []} />
    </div>
  );
}
