"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const DESKTOP_PREF_KEY = "ef-desktop-preferred";
const DESKTOP_PREF_TS_KEY = "ef-desktop-preferred-ts";
const MOBILE_BREAKPOINT = 768;
const PREF_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const MOBILE_REDIRECTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^\/hub\/clients\/(\d+)$/, replacement: "/hub/m/clients/$1" },
  { pattern: /^\/hub\/clients$/, replacement: "/hub/m/clients" },
  { pattern: /^\/hub$/, replacement: "/hub/m" },
];

function isPreferenceValid(): boolean {
  try {
    if (localStorage.getItem(DESKTOP_PREF_KEY) !== "1") return false;
    const ts = localStorage.getItem(DESKTOP_PREF_TS_KEY);
    if (!ts) return true; // legacy flag without timestamp — treat as valid
    return Date.now() - Number(ts) < PREF_TTL_MS;
  } catch {
    return false;
  }
}

function getMobilePath(pathname: string): string {
  for (const { pattern, replacement } of MOBILE_REDIRECTS) {
    if (pattern.test(pathname)) {
      return pathname.replace(pattern, replacement);
    }
  }
  return "/hub/m";
}

export function MobileRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const [showPill, setShowPill] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/hub/m")) return;

    if (isPreferenceValid()) {
      // On desktop hub pages at phone width, show "Open in the app" pill
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setShowPill(true);
      }
      return;
    }

    if (window.innerWidth < MOBILE_BREAKPOINT) {
      for (const { pattern, replacement } of MOBILE_REDIRECTS) {
        if (pattern.test(pathname)) {
          router.replace(pathname.replace(pattern, replacement));
          return;
        }
      }
    }
  }, [router, pathname]);

  const openMobile = useCallback(() => {
    try {
      localStorage.removeItem(DESKTOP_PREF_KEY);
      localStorage.removeItem(DESKTOP_PREF_TS_KEY);
    } catch {}
    router.replace(getMobilePath(pathname));
  }, [router, pathname]);

  if (!showPill) return null;

  return (
    <button
      type="button"
      onClick={openMobile}
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 9999,
        background: "var(--color-ink, #131313)",
        color: "#fff",
        border: "none",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(0,0,0,.25)",
        whiteSpace: "nowrap",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
      Open in the app
    </button>
  );
}
