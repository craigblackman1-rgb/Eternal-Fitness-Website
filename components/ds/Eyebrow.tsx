import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  color?: "rose" | "teal" | "white";
  center?: boolean;
  className?: string;
}

/** Uppercase label with a leading rule — the signature section kicker. */
export function Eyebrow({ children, color = "rose", center, className }: EyebrowProps) {
  return (
    <p className={`ds-eyebrow ds-eyebrow-${color} ${center ? "ds-eyebrow-center" : ""} ${className ?? ""}`}>
      {children}
    </p>
  );
}

export default Eyebrow;
