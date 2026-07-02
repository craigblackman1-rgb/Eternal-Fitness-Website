"use client";

import { useEffect, useRef } from "react";

interface PulseLineProps {
  /** stroke colour token */
  accent?: "rose" | "teal" | "white";
  /** overall width behaviour — the SVG always fills its container */
  className?: string;
}

const COLOURS = {
  rose: "#C1839F",
  teal: "#087E8B",
  white: "rgba(255,255,255,0.55)",
};

/**
 * A calm ECG pulse line — one heartbeat rising out of a flat baseline.
 * Draws itself on first view (skipped under prefers-reduced-motion).
 * Decorative only: aria-hidden.
 */
export function PulseLine({ accent = "rose", className }: PulseLineProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          path.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)";
          path.style.strokeDashoffset = "0";
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(path);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      viewBox="0 0 480 56"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <path
        ref={pathRef}
        d="M0 28 H150 L166 28 L176 12 L188 44 L198 20 L206 28 H240 L252 28 L260 22 L268 28 H480"
        stroke={COLOURS[accent]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="268" cy="28" r="3.5" fill={COLOURS[accent]} opacity="0.4" />
    </svg>
  );
}

export default PulseLine;
