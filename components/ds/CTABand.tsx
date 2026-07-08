import Image from "next/image";
import { CtaButton } from "./CtaButton";
import type { CTA } from "./types";

interface CTABandProps {
  image: string;
  imageAlt?: string;
  heading: string;
  body: string;
  primaryCta: CTA;
  secondaryCta?: CTA;
}

/**
 * Closing call-to-action band: background image + teal gradient overlay,
 * serif heading, dual buttons. Mirrors the homepage #cta and standardises
 * the closing CTA across every page.
 */
export function CTABand({ image, imageAlt, heading, body, primaryCta, secondaryCta }: CTABandProps) {
  return (
    <section className="ds-cta">
      <div className="ds-cta-bg">
        <Image src={image} alt={imageAlt ?? ""} fill sizes="100vw" style={{ objectFit: "cover" }} />
      </div>
      <div className="ds-cta-inner">
        <h2>{heading}</h2>
        <p>{body}</p>
        <div className="ds-cta-btns">
          <CtaButton cta={{ ...primaryCta, variant: primaryCta.variant ?? "white" }} />
          {secondaryCta && <CtaButton cta={{ ...secondaryCta, variant: secondaryCta.variant ?? "ghost-white" }} />}
        </div>
      </div>
    </section>
  );
}

export default CTABand;
