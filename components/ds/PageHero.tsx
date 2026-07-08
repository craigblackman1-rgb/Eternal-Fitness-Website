import Image from "next/image";
import type { ReactNode } from "react";
import { CtaButton } from "./CtaButton";
import type { CTA } from "./types";

interface PageHeroProps {
  image: string;
  imageAlt: string;
  eyebrow?: string;
  heading: ReactNode;
  subhead?: ReactNode;
  primaryCta?: CTA;
  secondaryCta?: CTA;
  /** floating badge, typically a <StatBadge /> */
  badge?: ReactNode;
}

/**
 * Premium inner-page hero: full-bleed image, dark gradient, eyebrow + serif H1,
 * subhead, dual CTAs and an optional floating badge. Consistent across all pages.
 */
export function PageHero({
  image,
  imageAlt,
  eyebrow,
  heading,
  subhead,
  primaryCta,
  secondaryCta,
  badge,
}: PageHeroProps) {
  return (
    <section className="ds-hero">
      <div className="ds-hero-bg">
        <Image src={image} alt={imageAlt} fill priority sizes="100vw" style={{ objectFit: "cover" }} />
      </div>
      <div className="ds-hero-inner">
        <div className="ds-hero-content">
          {eyebrow && <p className="ds-eyebrow ds-eyebrow-white">{eyebrow}</p>}
          <h1>{heading}</h1>
          {subhead && <p className="ds-hero-sub">{subhead}</p>}
          {(primaryCta || secondaryCta) && (
            <div className="ds-hero-btns">
              {primaryCta && <CtaButton cta={{ ...primaryCta, variant: primaryCta.variant ?? "primary" }} />}
              {secondaryCta && <CtaButton cta={{ ...secondaryCta, variant: secondaryCta.variant ?? "ghost-white" }} />}
            </div>
          )}
        </div>
      </div>
      {badge && <div className="ds-hero-badge">{badge}</div>}
    </section>
  );
}

export default PageHero;
