import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  eyebrowColor?: "rose" | "teal" | "white";
  heading: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  /** heading appears on a dark (ink/teal) background */
  light?: boolean;
  className?: string;
}

/** Eyebrow + serif H2 + optional intro — the consistent section opener. */
export function SectionHeading({
  eyebrow,
  eyebrowColor = "rose",
  heading,
  intro,
  align = "left",
  light,
  className,
}: SectionHeadingProps) {
  return (
    <Reveal y={24} className={`${align === "center" ? "ds-head-center" : "ds-head"} ${className ?? ""}`}>
      {eyebrow && (
        <Eyebrow color={light ? "white" : eyebrowColor} center={align === "center"}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2 className={`ds-h2 ${light ? "ds-h2-light" : ""}`}>{heading}</h2>
      {intro && <p className={`ds-body ${light ? "ds-body-light" : ""}`} style={{ marginTop: 16 }}>{intro}</p>}
    </Reveal>
  );
}

export default SectionHeading;
