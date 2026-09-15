import { createClient } from "@/lib/supabase-server";
import { getMoneySummary } from "@/lib/hub/money-summary";
import { MoneyScreen } from "./MoneyScreen";

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total: number;
  client_name: string;
  client_number: number;
}

export default async function MobileMoneyPage() {
  const supabase = createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, issue_date, due_date, status, total, clients(name, client_number)")
    .order("created_at", { ascending: false });

  const list: InvoiceListItem[] = (invoices ?? []).map((inv: Record<string, unknown>) => {
    const clients = inv.clients as { name?: string; client_number?: number } | null;
    return {
      id: inv.id as string,
      invoice_number: inv.invoice_number as string,
      issue_date: inv.issue_date as string,
      due_date: inv.due_date as string,
      status: inv.status as string,
      total: Number(inv.total),
      client_name: clients?.name ?? "Unknown",
      client_number: clients?.client_number ?? 0,
    };
  });

  // BUG-EF-176 — use the same shared helper the desktop cashflow page uses
  // for KPIs and action queue, so both surfaces show the same numbers.
  let collected = 0;
  let outstanding = 0;
  let actionQueue: import("@/lib/hub/money-summary").MoneyActionItem[] = [];
  let draftCount = 0;
  try {
    const summary = await getMoneySummary();
    collected = summary.collected;
    outstanding = summary.outstanding;
    actionQueue = summary.actionQueue;
    draftCount = summary.draftCount;
  } catch {
    // If the helper throws, show zero values — not a reassuring empty state.
  }

  return (
    <MoneyScreen
      invoices={list}
      collected={collected}
      outstanding={outstanding}
      actionQueue={actionQueue}
      draftCount={draftCount}
    />
  );
}
