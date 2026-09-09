"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent } from "react";

export default function BackLink({
  fallback,
  children,
  className,
}: {
  fallback: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <a href={fallback} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
