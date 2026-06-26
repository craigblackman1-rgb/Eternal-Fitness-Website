import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { HubSidebar } from "./HubSidebar";
import { HubBreadcrumb } from "./HubBreadcrumb";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/hub/login");
  }

  return (
    <div className="flex min-h-screen bg-off-white">
      <HubSidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border/50">
          <div className="mx-auto max-w-6xl px-6 lg:px-8 h-14 flex items-center justify-between">
            <HubBreadcrumb />
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-rose/10 text-rose flex items-center justify-center text-xs font-bold">
                EF
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
