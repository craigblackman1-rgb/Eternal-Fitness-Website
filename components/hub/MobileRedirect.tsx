"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_PREF_KEY = "ef-desktop-preferred";

export function MobileRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/hub/m") return;

    let pref = false;
    try {
      pref = localStorage.getItem(DESKTOP_PREF_KEY) === "1";
    } catch {}

    if (pref) return;

    /* Desktop pages are now responsive — no redirect needed. Phone-width
       visitors see the desktop layout rendered at their viewport width,
       keeping the destination URL intact. */
  }, [router, pathname]);

  return null;
}
