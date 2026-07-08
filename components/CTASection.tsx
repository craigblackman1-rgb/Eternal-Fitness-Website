"use client";

import { CTABand } from "@/components/ds";

interface CTASectionProps {
  onBookConsultation?: () => void;
}

/**
 * Thin wrapper kept for backwards-compatible imports (Blog pages).
 * Renders the shared CTABand so the closing CTA matches the rest of the site.
 */
const CTASection = ({ onBookConsultation }: CTASectionProps) => {
  return (
    <CTABand
      image="/images/studio-1.jpg"
      heading="Ready to find out if this is right for you?"
      body="The first conversation is free, there is no commitment, and there is no such thing as the wrong question. I work with a small number of clients at any one time — so every person gets my full attention."
      primaryCta={
        onBookConsultation
          ? { label: "Book a Free Consultation", onClick: onBookConsultation }
          : { label: "Book a Free Consultation", href: "/contact" }
      }
      secondaryCta={{ label: "Give Me a Call", href: "tel:07517658128", variant: "ghost-white" }}
    />
  );
};

export default CTASection;
