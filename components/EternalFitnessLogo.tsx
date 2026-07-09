interface EternalFitnessLogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

const EternalFitnessLogo = ({
  className = "",
  variant = "light",
  size = "md",
}: EternalFitnessLogoProps) => {
  const isLight = variant === "light";
  const wordmarkColor = isLight ? "#FFFFFF" : "#2D3436";
  const labelColor = isLight ? "rgba(255,255,255,0.72)" : "rgba(45,52,54,0.62)";
  const roseColor = "#C1839F";

  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto",
  };

  return (
    <svg
      viewBox="0 0 190 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${sizeClasses[size]}`}
      aria-label="Eternal Fitness"
      role="img"
    >
      {/* Wordmark — set in the same serif used for emphasis words across the
          site (hero "for Health", section headings), so the logo reads as
          the same voice as the rest of the brand rather than a separate
          system. */}
      <text
        x="0"
        y="32"
        fontFamily="var(--font-dm-serif-display), Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="400"
        fontSize="27"
        letterSpacing="0.2"
        fill={wordmarkColor}
      >
        Eternal
      </text>

      {/* Signature device: the short rose dash that precedes every eyebrow
          label sitewide (— WORTHING, WEST SUSSEX / — ABOUT ESTHER), reused
          here so the logo shares its one recurring mark with the rest of
          the brand instead of inventing a new symbol. */}
      <line
        x1="104"
        y1="24"
        x2="120"
        y2="24"
        stroke={roseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <text
        x="128"
        y="29"
        fontFamily="var(--font-dm-sans), 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="11"
        letterSpacing="2.2"
        fill={labelColor}
      >
        FITNESS
      </text>
    </svg>
  );
};

export default EternalFitnessLogo;
