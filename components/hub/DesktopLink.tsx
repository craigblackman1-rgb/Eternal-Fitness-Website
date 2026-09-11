"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { DESKTOP_PREF_KEY, DESKTOP_PREF_TS_KEY } from "./MobileRedirect";

export function DesktopLink({
  onClick,
  ...rest
}: ComponentProps<typeof Link>) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      localStorage.setItem(DESKTOP_PREF_KEY, "1");
      localStorage.setItem(DESKTOP_PREF_TS_KEY, String(Date.now()));
    } catch {}
    onClick?.(e);
  };

  return <Link {...rest} onClick={handleClick} />;
}
