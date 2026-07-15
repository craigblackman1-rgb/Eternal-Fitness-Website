import type { Metadata } from "next";

// Client PAR-Q intake form — never indexable, defense-in-depth alongside robots.ts.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ParqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
