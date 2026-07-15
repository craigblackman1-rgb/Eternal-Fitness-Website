import type { Metadata } from "next";

// Staff/client hub — auth pages and everything behind them. Never indexable,
// defense-in-depth alongside robots.ts's /hub/ disallow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
