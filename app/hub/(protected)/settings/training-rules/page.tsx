import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { TrainingRuleTypesManager } from "./TrainingRuleTypesManager";
import type { TrainingRuleType } from "@/types";

export default async function TrainingRuleTypesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  const { data: ruleTypes } = await supabase
    .from("training_rule_types")
    .select("*")
    .order("bucket", { ascending: true })
    .order("label", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Training Rules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The rule types available when setting a client&apos;s structured programming rules
          (Client → Edit → Training Rules). Add a new type here first — no deploy needed — then it
          shows up on every client&apos;s editor. The Plan Agent applies these systematically, grouped
          by bucket, instead of relying on it to parse free text.
        </p>
      </div>
      <TrainingRuleTypesManager initialRuleTypes={(ruleTypes ?? []) as TrainingRuleType[]} />
    </div>
  );
}
