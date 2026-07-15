import type { Metadata } from "next";

// Client training agreement form — never indexable, defense-in-depth alongside robots.ts.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AgreementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
