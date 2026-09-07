import Link from "next/link";
import type { ForecastResult } from "@/lib/cashflow-forecast";
import { IconTrendUp, IconTriangleAlert } from "@/components/icons";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export function ForecastSection({ forecast }: { forecast: ForecastResult }) {
  if (!forecast.hasSettings) {
    return (
      <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-[0_1px_2px_rgba(16,24,40,.04),0_1px_3px_rgba(16,24,40,.07)] overflow-hidden mb-3.5">
        <div className="flex items-center gap-2.5 py-2.5 px-4 border-b border-[var(--hub-border)]">
          <IconTrendUp className="w-4 h-4 text-[var(--color-teal)]" />
          <h2 className="m-0 text-[15px] font-bold text-[var(--color-ink)] tracking-tight">Forecast</h2>
        </div>
        <div className="px-4 py-6 text-[13px] text-[var(--color-muted)]">
          Enter your current bank balance to generate a forecast.{" "}
          <Link href="/hub/cashflow/forecast" className="text-[var(--color-rose)] font-semibold hover:underline">
            Open forecast
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const hasNegative = forecast.projection.some((m) => m.closing < 0);

  return (
    <div className="bg-white border border-[var(--hub-border)] rounded-surface shadow-[0_1px_2px_rgba(16,24,40,.04),0_1px_3px_rgba(16,24,40,.07)] overflow-hidden mb-3.5">
      <div className="flex items-center gap-2.5 py-2.5 px-4 border-b border-[var(--hub-border)]">
        <IconTrendUp className="w-4 h-4 text-[var(--color-teal)]" />
        <h2 className="m-0 text-[15px] font-bold text-[var(--color-ink)] tracking-tight">Forecast</h2>
        <span className="text-xs text-[var(--color-muted)]">12-month projection</span>
      </div>
      <div className="px-4 py-3">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 mb-3">
          <div className="rounded-nested border border-[var(--hub-border)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)] m-0 mb-1">Current balance</p>
            <p className="text-lg font-bold text-[var(--color-ink)] tabular-nums m-0">{formatCurrency(forecast.currentBalance)}</p>
          </div>
          <div className="rounded-nested border border-[var(--hub-border)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)] m-0 mb-1">Less tax reserve</p>
            <p className="text-lg font-bold text-[var(--color-ink)] tabular-nums m-0">–{formatCurrency(forecast.taxReserve)}</p>
          </div>
          <div className="rounded-nested border border-[var(--hub-border)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)] m-0 mb-1">Starting balance</p>
            <p className="text-lg font-bold text-[var(--color-ink)] tabular-nums m-0">{formatCurrency(forecast.startingBalance)}</p>
          </div>
        </div>

        {hasNegative && (
          <div className="flex gap-2 items-start rounded-nested p-2.5 mb-3 text-[12px] bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)]">
            <IconTriangleAlert className="w-4 h-4 shrink-0 text-[var(--status-warning-text)] mt-px" />
            <span className="text-[var(--color-ink)]">The forecast goes negative in one or more months — check the detail.</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--color-muted)] m-0">
            Updated {todayStr} · based on unpaid invoices and pending bills
          </p>
          <Link href="/hub/cashflow/forecast" className="text-xs font-semibold text-[var(--color-rose)] hover:underline">
            Full forecast ›
          </Link>
        </div>
      </div>
    </div>
  );
}
