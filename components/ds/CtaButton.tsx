import Link from "next/link";
import { IconArrowUpRight } from "@/components/icons";
import type { CTA } from "./types";

const variantClass: Record<NonNullable<CTA["variant"]>, string> = {
  primary: "ef-btn-primary",
  dark: "ef-btn-dark",
  outline: "ef-btn-outline",
  white: "ef-btn-white",
  "ghost-white": "ef-btn-ghost-white",
};

/** Renders a CTA as a link (href) or button (onClick) using the shared .ef-btn system. */
export function CtaButton({ cta }: { cta: CTA }) {
  const cls = `ef-btn ${variantClass[cta.variant ?? "primary"]}`;
  const inner = (
    <>
      {cta.label}
      {cta.arrow && <IconArrowUpRight className="w-4 h-4" />}
    </>
  );

  if (cta.href) {
    return (
      <Link href={cta.href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={cta.onClick} className={cls}>
      {inner}
    </button>
  );
}

export default CtaButton;
