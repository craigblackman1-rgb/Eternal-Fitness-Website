import type { Metadata } from "next";

// Signed client documents (PAR-Q/agreement PDFs) — never indexable, defense-in-depth alongside robots.ts.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
