import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { EquipmentManager } from "./EquipmentManager";
import type { StudioEquipment } from "@/types";

export default async function StudioEquipmentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  const { data: equipment } = await supabase
    .from("studio_equipment")
    .select("*")
    .order("sort_order", { ascending: true });

  const initialEquipment = (equipment ?? []) as StudioEquipment[];
  const activeCount = initialEquipment.filter((e) => e.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Studio equipment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The Plan Agent can only programme from items listed here. Toggle off anything out of service.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)] px-2.5 py-1 text-xs font-semibold">
          {activeCount} active
        </span>
      </div>
      <EquipmentManager initialEquipment={initialEquipment} />
    </div>
  );
}
