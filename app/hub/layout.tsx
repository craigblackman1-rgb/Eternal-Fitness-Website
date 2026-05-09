import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { HubSidebar } from "./HubSidebar";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/hub/login");
  }

  return (
    <div className="flex min-h-screen">
      <HubSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
