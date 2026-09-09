"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const DESKTOP_PREF_KEY = "ef-desktop-preferred";
const MOBILE_BREAKPOINT = 768;

const MOBILE_REDIRECTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^\/hub\/clients\/(\d+)$/, replacement: "/hub/m/clients/$1" },
  { pattern: /^\/hub\/clients$/, replacement: "/hub/m/clients" },
  { pattern: /^\/hub$/, replacement: "/hub/m" },
];

export function MobileRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/hub/m")) return;

    let pref = false;
    try {
      pref = localStorage.getItem(DESKTOP_PREF_KEY) === "1";
    } catch {}

    if (pref) return;

    if (window.innerWidth < MOBILE_BREAKPOINT) {
      for (const { pattern, replacement } of MOBILE_REDIRECTS) {
        if (pattern.test(pathname)) {
          router.replace(pathname.replace(pattern, replacement));
          return;
        }
      }
    }
  }, [router, pathname]);

  return null;
}
