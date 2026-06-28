// EF condition icon system — 1.8px stroke, rounded caps, brand palette
// Usage: <IconHeart className="..." style={{ width: 36, height: 36 }} /> (currentColor)

import type { CSSProperties } from "react";

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

function base(className?: string, style?: CSSProperties) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    style,
    "aria-hidden": true,
  };
}

export function IconHeart({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M16 27S4 19.5 4 11.5A7 7 0 0 1 16 7.17 7 7 0 0 1 28 11.5C28 19.5 16 27 16 27z" />
    </svg>
  );
}

export function IconBloodPressure({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="16" cy="16" r="10" />
      <path d="M16 10v6l4 2" />
      <path d="M8 6c-1.5 1.5-2 3-2 4" />
      <path d="M24 6c1.5 1.5 2 3 2 4" />
    </svg>
  );
}

export function IconLungs({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M16 6v8" />
      <path d="M10 14c-3 0-5 2-5 5s2 5 5 5h2V14z" />
      <path d="M22 14c3 0 5 2 5 5s-2 5-5 5h-2V14z" />
      <path d="M14 14v9" />
      <path d="M18 14v9" />
    </svg>
  );
}

export function IconBone({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="24" cy="8" r="3" />
      <circle cx="8" cy="24" r="3" />
      <circle cx="24" cy="24" r="3" />
      <path d="M11 8h10M8 11v10M24 11v10M11 24h10" />
    </svg>
  );
}

export function IconDiabetes({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M16 5a5 5 0 0 1 5 5c0 4-5 11-5 11S11 14 11 10a5 5 0 0 1 5-5z" />
      <path d="M13 22h6" />
      <path d="M14 25h4" />
    </svg>
  );
}

export function IconEye({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M4 16s4-8 12-8 12 8 12 8-4 8-12 8-12-8-12-8z" />
      <circle cx="16" cy="16" r="3.5" />
    </svg>
  );
}

export function IconAccessibility({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="16" cy="7" r="2.5" />
      <path d="M16 10v8" />
      <path d="M10 13h12" />
      <path d="M12 18l-2 7" />
      <path d="M20 18l2 7" />
    </svg>
  );
}

export function IconRibbon({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M16 5c2.5 2.5 7 5 7 9a7 7 0 0 1-14 0c0-4 4.5-6.5 7-9z" />
      <path d="M13 21l-3 6" />
      <path d="M19 21l3 6" />
    </svg>
  );
}

export function IconBrain({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M10 20c-3.5 0-5-2.5-5-5a5 5 0 0 1 4-4.9V9a3 3 0 0 1 6 0v.5a5 5 0 0 1 1 9.5" />
      <path d="M22 20c3.5 0 5-2.5 5-5a5 5 0 0 0-4-4.9V9a3 3 0 0 0-6 0v.5" />
      <path d="M10 20h12" />
      <path d="M16 20v5" />
      <path d="M13 25h6" />
    </svg>
  );
}

export function IconMove({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="16" cy="6" r="2.5" />
      <path d="M12 14l-3 11" />
      <path d="M20 14l3 11" />
      <path d="M10 11h12l-2 8H12z" />
    </svg>
  );
}

export function IconListenAdapt({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M20 12a4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4z" />
      <path d="M8 12C8 7.6 11.6 4 16 4s8 3.6 8 8" />
      <path d="M6 12C6 6.5 10.5 2 16 2s10 4.5 10 10" />
      <path d="M16 20v2" />
      <path d="M12 24c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    </svg>
  );
}
