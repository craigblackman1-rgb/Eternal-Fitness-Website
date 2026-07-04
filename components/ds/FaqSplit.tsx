"use client";

import { Eyebrow } from "./Eyebrow";
import { CtaButton } from "./CtaButton";
import { PulseLine } from "./artwork/PulseLine";
import type { CTA } from "./types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FaqItem {
  title: string;
  body: string;
}

interface FaqSplitProps {
  eyebrow?: string;
  heading: string;
  intro?: string;
  cta?: CTA;
  items: FaqItem[];
  accent?: "rose" | "teal";
}

/**
 * Shared FAQ pattern — sticky editorial rail on the left (heading, intro,
 * booking CTA, pulse-line motif), numbered accordion on the right. Replaces
 * bare centred accordions on condition and specialist pages.
 */
export function FaqSplit({
  eyebrow = "Common Questions",
  heading,
  intro,
  cta,
  items,
  accent = "rose",
}: FaqSplitProps) {
  return (
    <div className="grid md:grid-cols-[minmax(0,380px)_1fr] gap-12 md:gap-20 items-start">
      <div className="md:sticky md:top-24">
        <Eyebrow color={accent}>{eyebrow}</Eyebrow>
        <h2 className="ds-h2" style={{ margin: "16px 0", fontSize: "clamp(30px, 2.8vw, 42px)" }}>
          {heading}
        </h2>
        {intro && (
          <p className="ds-body" style={{ marginBottom: 24 }}>
            {intro}
          </p>
        )}
        <div style={{ maxWidth: 200, marginBottom: 28, opacity: 0.9 }}>
          <PulseLine accent={accent} />
        </div>
        {cta && <CtaButton cta={cta} />}
      </div>

      <Accordion type="single" collapsible className="w-full md:pt-2">
        {items.map((f, i) => (
          <AccordionItem key={f.title} value={`faq-${i}`} className="border-border-warm">
            <AccordionTrigger className="font-body text-foreground text-left text-[16.5px] font-medium py-6 hover:no-underline gap-4">
              <span className="flex items-baseline gap-5 text-left">
                <span className={`text-[11px] font-bold tabular-nums shrink-0 ${accent === "rose" ? "text-rose" : "text-teal"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {f.title}
              </span>
            </AccordionTrigger>
            <AccordionContent className="ef-body text-[15px] leading-relaxed pb-7 pl-[38px] max-w-[600px]">
              {f.body}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default FaqSplit;
