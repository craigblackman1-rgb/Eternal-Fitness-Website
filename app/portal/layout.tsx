import type { Metadata } from "next";

// Client portal — private, authenticated client data. Never indexable,
// defense-in-depth alongside robots.ts's /portal/ disallow. Pure metadata
// wrapper only (no auth logic here) — auth-gating lives in
// app/portal/(protected)/layout.tsx so this can also cover /portal/login.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
