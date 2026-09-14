"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect } from "react";
import { IconArrowLeft } from "@/components/icons";

export default function BackLink({
  fallbackHref,
  fallback,
  label,
  className,
  children,
}: {
  fallbackHref?: string;
  fallback?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const href = fallbackHref ?? fallback ?? "/";

  useEffect(() => {
    sessionStorage.setItem("hub-nav", "1");
  }, []);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const hasHistory = window.history.length > 1;
    let sameOrigin = false;
    try {
      if (document.referrer) {
        sameOrigin = new URL(document.referrer).origin === window.location.origin;
      }
    } catch {}
    const hasSessionNav = sessionStorage.getItem("hub-nav") === "1";
    if (hasHistory && (sameOrigin || hasSessionNav)) {
      router.back();
    } else {
      router.push(href);
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? (
        <>
          <IconArrowLeft className="h-4 w-4" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
