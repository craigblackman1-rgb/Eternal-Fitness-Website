import { createClient } from "@/lib/supabase-server";
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

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const collected = list
    .filter((inv) => inv.status === "paid" && inv.issue_date >= monthStart && inv.issue_date <= monthEnd)
    .reduce((sum, inv) => sum + inv.total, 0);

  const outstanding = list
    .filter((inv) => inv.status !== "paid" && inv.status !== "void" && inv.status !== "draft")
    .reduce((sum, inv) => sum + inv.total, 0);

  return <MoneyScreen invoices={list} collected={collected} outstanding={outstanding} />;
}
