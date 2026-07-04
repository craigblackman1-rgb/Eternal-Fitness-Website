import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { HubSidebar } from "./HubSidebar";
import { HubTopbar } from "./HubTopbar";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/hub/login");
  }

  return (
    <div className="hub-shell flex min-h-screen bg-[var(--hub-canvas)]">
      <HubSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <HubTopbar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1600px] px-6 py-7 lg:px-10 lg:py-9">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
