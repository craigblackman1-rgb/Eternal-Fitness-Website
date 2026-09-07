import Link from "next/link";
import { IconTriangleAlert } from "@/components/icons";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export function TaxSection({
  taxYear,
  taxBounds,
  calculation,
}: {
  taxYear: string;
  taxBounds: { periodStart: string; periodEnd: string };
  calculation: { total_tax_due: number; taxable_profit: number } | null;
}) {
  const periodStart = new Date(taxBounds.periodStart + "T00:00:00");
  const periodEnd = new Date(taxBounds.periodEnd + "T00:00:00");
  const dateRangeLabel = `${periodStart.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${periodEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-[0_1px_2px_rgba(16,24,40,.04),0_1px_3px_rgba(16,24,40,.07)] overflow-hidden mb-3.5">
      <div className="flex items-center gap-2.5 py-2.5 px-4 border-b border-[var(--hub-border)]">
        <h2 className="m-0 text-[15px] font-bold text-[var(--color-ink)] tracking-tight">Tax estimate</h2>
        <span className="text-xs text-[var(--color-muted)]">Tax year {taxYear}</span>
      </div>
      <div className="px-4 py-3">
        {calculation ? (
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)] m-0 mb-1">
                Estimated total due
              </p>
              <p className="text-[28px] font-bold text-[var(--color-ink)] m-0 tabular-nums tracking-[-.02em] leading-none">
                {formatCurrency(calculation.total_tax_due)}
              </p>
              <p className="text-[12px] text-[var(--color-muted)] mt-1 m-0">
                {dateRangeLabel} · based on {formatCurrency(calculation.taxable_profit)} taxable profit
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.05em] text-[var(--status-warning-text)] bg-white border border-[var(--status-warning-border)] rounded-pill px-2.5 py-1">
                <IconTriangleAlert className="w-3 h-3" />
                Estimate
              </span>
              <Link href="/hub/cashflow/tax" className="text-xs font-semibold text-[var(--color-rose)] hover:underline">
                Full detail ›
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-3 text-[13px] text-[var(--color-muted)]">
            No tax calculation yet for {taxYear}.{" "}
            <Link href="/hub/cashflow/tax" className="text-[var(--color-rose)] font-semibold hover:underline">
              Generate first estimate
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
