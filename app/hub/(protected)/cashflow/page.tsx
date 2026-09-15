import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { StatusBadge, KpiTile } from "@/components/hub";
import { IconCheckCircle, IconCheck, IconClock, IconTriangleAlert } from "@/components/icons";
import { computeForecast } from "@/lib/cashflow-forecast";
import { currentTaxYear, getTaxYearBounds } from "@/lib/cashflow-tax";
import { getMoneySummary } from "@/lib/hub/money-summary";
import { ForecastSection } from "./ForecastSection";
import { TaxSection } from "./TaxSection";

/* ── S9 Finance overview (design-systems v3/13-finance.html) ──────────────
   Replaces the old four-KPI-tile + tax/forecast-card dashboard. The reality
   check that shapes this page (Craig, 5 Sep 2026): "Everyone has paid
   outside of the hub so to say they are due to pay would be incorrect." All
   21 previously-"pending" clients were bulk-flipped to payment_status =
   'paid' that day for exactly that reason — the flag had been lying the
   whole time. Neither clients.payment_status nor invoices.status is a
   bank-verified fact; only a matched bank_transactions row is. So this page
   does not claim to know who owes money — it shows what paperwork is open
   and what the bank has actually confirmed.

   Every queue row below traces to a real column (see the five decision
   types in the mockup's Q1 comment). Nothing here is illustrative — where
   the mockup used placeholder examples (Rick Frenken, Steph White, a "3
   bank lines" count), this build uses whatever the real query returns,
   including "none" when that is the true state.

   Tax, Forecast, Reconciliation and Bank transactions are cut from this
   dashboard's framing (per the mockup's Q2 comment) but not from the hub —
   they keep their own pages and routes, reachable from "Elsewhere in
   Finance" below. Nothing was deleted. */

export const dynamic = "force-dynamic";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const DOT: Record<string, string> = {
  due: "bg-rose",
  warn: "bg-[var(--status-warning)]",
  quiet: "bg-[var(--status-success)]",
};

export default async function CashflowOverviewPage() {
  const supabase = createClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const taxYear = currentTaxYear();
  const taxBounds = getTaxYearBounds(taxYear);

  const [clientsRes, invoicesRes, invoiceCountRes, forecast, taxCalcRes] =
    await Promise.all([
      supabase
        .from("clients")
        .select(
          "id, name, client_number, client_status, block_expiry_date, sessions_remaining, sessions_purchased, pot_baseline_used, client_rate, session_duration",
        )
        .eq("client_status", "active"),
      supabase
        .from("invoices")
        .select("id, invoice_number, status, total, issue_date, due_date, updated_at, created_at, clients(name, client_number, display_code)")
        .order("updated_at", { ascending: false }),
      supabase.from("invoices").select("id", { count: "exact", head: true }),
      computeForecast(),
      supabase
        .from("tax_calculations")
        .select("total_tax_due, taxable_profit")
        .eq("tax_year", taxYear)
        .eq("period_type", "annual")
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const clients = clientsRes.data ?? [];
  const allInvoices = invoicesRes.data ?? [];
  const invoiceTotalCount = invoiceCountRes.count ?? allInvoices.length;

  // ── Finance KPIs — from the same shared helper the PWA money page uses ──
  const summary = await getMoneySummary(now);
  const kpiInvoiced = summary.invoiced;
  const kpiPaid = summary.collected;
  const kpiOutstanding = summary.outstanding;
  const kpiOverdue = summary.overdue;
  const queue = summary.actionQueue;

  const needCount = queue.length;
  const recentInvoices = allInvoices.slice(0, 7);

  return (
    <div className="w-full">
      {/* Header — no avatar, this page has no single subject. */}
      <div className="mb-3.5">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h1 className="m-0 text-[22px] font-bold tracking-[-.015em] text-[var(--color-ink)]">Cashflow</h1>
        </div>
        <p className="mt-1 mb-0 text-[13px] text-[var(--color-body)] max-w-[76ch]">
          Invoices you&rsquo;ve raised through the hub, and what the bank actually confirms. Most of Esther&rsquo;s
          clients pay her outside the app — this page cannot tell you who owes money, only what paperwork is open.
        </p>
      </div>

      {/* ── KPI band ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        <KpiTile
          icon={<IconCheckCircle className="h-5 w-5" />}
          label="Invoiced this month"
          value={fmt(kpiInvoiced)}
          statusToken="success"
        />
        <KpiTile
          icon={<IconCheck className="h-5 w-5" />}
          label="Paid"
          value={fmt(kpiPaid)}
          statusToken="primary"
        />
        <KpiTile
          icon={<IconClock className="h-5 w-5" />}
          label="Outstanding"
          value={fmt(kpiOutstanding)}
          statusToken="warning"
        />
        <KpiTile
          icon={<IconTriangleAlert className="h-5 w-5" />}
          label="Overdue"
          value={fmt(kpiOverdue)}
          statusToken={kpiOverdue > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* ── Needs you ── */}
      <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden mb-3.5">
        <div className="flex items-center gap-2.5 py-2.5 px-4 border-b border-[var(--hub-border)]">
          <h2 className="m-0 text-[15px] font-bold text-[var(--color-ink)] tracking-tight">Needs you</h2>
          <span className="text-xs text-[var(--color-muted)]">
            {needCount > 0 ? `${needCount} thing${needCount === 1 ? "" : "s"}` : "Nothing outstanding"}
          </span>
        </div>
        <div className="px-4 pb-3 pt-1">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 px-3 rounded-nested border border-transparent transition-colors duration-100 hover:bg-[var(--hub-hover)] hover:border-[var(--hub-border)]"
            >
              <span className={`w-[7px] h-[7px] rounded-pill shrink-0 mt-0.5 self-start ${DOT[item.tone]}`} />
              <span className="min-w-0 flex-1 text-[13.5px] text-[var(--color-ink)]">
                <b className="font-semibold">{item.headline}</b>
                <span className="block text-xs text-[var(--color-muted)] mt-px">{item.subline}</span>
              </span>
              <Link
                href={item.href}
                className="shrink-0 inline-flex items-center justify-center rounded-control border border-[var(--hub-field-border)] bg-white hover:bg-[var(--hub-hover)] text-foreground px-2.5 py-1 min-h-[30px] text-xs font-semibold no-underline transition-colors"
              >
                {item.actionLabel}
              </Link>
            </div>
          ))}

          {queue.length === 0 && (
            <div className="flex items-center gap-2.5 py-2 px-3 text-[13px] text-[var(--color-muted)]">
              <span className="w-[7px] h-[7px] rounded-pill bg-[var(--status-success)] shrink-0" />
              <span>Nothing open. No draft or overdue invoices, no unconfirmed bank matches, and no missing rates.</span>
            </div>
          )}

          {queue.length > 0 && (
            <>
              <hr className="h-px bg-[var(--hub-border)] border-0 my-3" />
              <div className="flex items-center gap-2.5 py-2 px-3 text-[13px] text-[var(--color-muted)]">
                <span className="w-[7px] h-[7px] rounded-pill bg-[var(--status-success)] shrink-0" />
                <span>
                  Nothing else open. Every other invoice on file is either confirmed paid by a matched bank line, or
                  has no due date yet to check against.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── The register ── */}
      <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-sm overflow-hidden mb-3.5">
        <div className="flex items-center gap-2.5 py-2.5 px-4 border-b border-[var(--hub-border)]">
          <h2 className="m-0 text-[15px] font-bold text-[var(--color-ink)] tracking-tight">Invoices</h2>
          <span className="text-xs text-[var(--color-muted)]">
            {invoiceTotalCount > 0
              ? `Most recent ${recentInvoices.length} of ${invoiceTotalCount} on file`
              : "None raised yet"}
          </span>
        </div>

        {recentInvoices.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground bg-[var(--hub-hover)] px-4 h-10 border-b border-[var(--hub-border)] whitespace-nowrap">
                      Invoice
                    </th>
                    <th className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground bg-[var(--hub-hover)] px-4 h-10 border-b border-[var(--hub-border)] whitespace-nowrap">
                      Client
                    </th>
                    <th className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground bg-[var(--hub-hover)] px-4 h-10 border-b border-[var(--hub-border)] whitespace-nowrap">
                      Issued
                    </th>
                    <th className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground bg-[var(--hub-hover)] px-4 h-10 border-b border-[var(--hub-border)] whitespace-nowrap">
                      Due
                    </th>
                    <th className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground bg-[var(--hub-hover)] px-4 h-10 border-b border-[var(--hub-border)] whitespace-nowrap">
                      Amount
                    </th>
                    <th className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground bg-[var(--hub-hover)] px-4 h-10 border-b border-[var(--hub-border)] whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground bg-[var(--hub-hover)] px-4 h-10 border-b border-[var(--hub-border)] whitespace-nowrap" />
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-[var(--hub-border)] hover:bg-[var(--hub-hover)] transition-colors">
                      <td className="px-4 py-[10px] font-semibold text-foreground tabular-nums">
                        <Link href={`/hub/cashflow/invoices/${inv.id}`} className="hover:underline">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-[10px] text-foreground">{inv.clients?.name ?? "—"}</td>
                      <td className="px-4 py-[10px] text-muted-foreground tabular-nums">{fmtDate(inv.issue_date)}</td>
                      <td className="px-4 py-[10px] text-muted-foreground tabular-nums">{fmtDate(inv.due_date)}</td>
                      <td className="px-4 py-[10px] text-right tabular-nums font-medium text-foreground">
                        {fmt(inv.total)}
                      </td>
                      <td className="px-4 py-[10px]">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-[10px]">
                        <Link
                          href={`/hub/cashflow/invoices/${inv.id}`}
                          className="text-[var(--color-teal)] hover:underline font-medium text-[13px]"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-[var(--hub-border)]">
              <Link href="/hub/cashflow/invoices" className="text-xs font-semibold text-[var(--color-rose)] hover:underline">
                See all {invoiceTotalCount} invoice{invoiceTotalCount === 1 ? "" : "s"} ›
              </Link>
            </div>
          </>
        ) : (
          <div className="px-4 py-6 text-[13px] text-[var(--color-body)]">
            No invoices raised through the hub yet.{" "}
            <Link href="/hub/cashflow/invoices/new" className="text-[var(--color-rose)] font-semibold hover:underline">
              Raise the first one
            </Link>
            .
          </div>
        )}
      </div>

      {/* ── Forecast (merged from /cashflow/forecast) ── */}
      <ForecastSection forecast={forecast} />

      {/* ── Tax estimate (merged from /cashflow/tax) ── */}
      <TaxSection
        taxYear={taxYear}
        taxBounds={taxBounds}
        calculation={taxCalcRes.data as { total_tax_due: number; taxable_profit: number } | null}
      />

      {/* ── Elsewhere in Finance ──
           Reconciliation is now a tab on Bank transactions.
           Tax and Forecast are inlined above. */}
      <div className="flex items-center gap-1.5 flex-wrap py-2.5 px-3 bg-white border border-[var(--hub-border)] rounded-nested shadow-sm">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-muted)] pr-1">
          Elsewhere
        </span>
        <Link href="/hub/cashflow/transactions" className="flex flex-col px-2.5 py-1.5 rounded-control hover:bg-[var(--hub-hover)] no-underline">
          <b className="text-[12.5px] font-semibold text-[var(--color-ink)]">Bank transactions &amp; reconciliation</b>
          <span className="text-[11.5px] text-[var(--color-muted)]">Import statements, categorise lines, match to invoices</span>
        </Link>
      </div>
    </div>
  );
}
