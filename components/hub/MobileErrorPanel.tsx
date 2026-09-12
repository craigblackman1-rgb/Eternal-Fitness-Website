"use client";

import Link from "next/link";

export function MobileErrorPanel({
  error,
  reset,
  backHref,
  backLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="mobile-shell">
      <header className="top">
        <div className="top-row">
          <Link className="back-btn" href={backHref} aria-label={backLabel}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <div className="top-id">
            <div className="top-client">Something went wrong</div>
          </div>
        </div>
      </header>
      <div className="mcontent" style={{ paddingTop: 40 }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
          padding: "32px 0",
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted, #94a3b8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <p style={{ fontSize: 14, color: "var(--muted, #94a3b8)", maxWidth: 320, lineHeight: 1.6 }}>
            {error.message || "An unexpected error occurred."}
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: "var(--muted, #94a3b8)", opacity: 0.6 }}>
              Ref: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 44,
              padding: "0 24px",
              borderRadius: 10,
              border: "1px solid var(--s-primary-bd, rgba(193,131,159,.3))",
              background: "var(--s-primary-bg, rgba(193,131,159,.08))",
              color: "var(--rose, #c08496)",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              width: "100%",
              maxWidth: 280,
            }}
          >
            Reload
          </button>
          <Link
            href={backHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 44,
              padding: "0 24px",
              borderRadius: 10,
              border: "1px solid var(--border, #e2e8f0)",
              background: "var(--card, #fff)",
              color: "var(--ink, #1e293b)",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              width: "100%",
              maxWidth: 280,
            }}
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
