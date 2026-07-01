import type { ReactNode } from "react";
import type { SectionBg } from "./types";

const bgClass: Record<SectionBg, string> = {
  white: "ds-bg-white",
  cream: "ds-bg-cream",
  ink: "ds-bg-ink",
  teal: "ds-bg-teal",
};

interface SectionProps {
  children: ReactNode;
  background?: SectionBg;
  id?: string;
  className?: string;
  /** width of inner container; defaults to the 1320px site rhythm */
  innerClassName?: string;
}

/** Standard section shell: alternating background + centred 1320px inner column. */
export function Section({ children, background = "white", id, className, innerClassName }: SectionProps) {
  return (
    <section id={id} className={`ds-sec ${bgClass[background]} ${className ?? ""}`}>
      <div className={`ds-sin ${innerClassName ?? ""}`}>{children}</div>
    </section>
  );
}

export default Section;
