interface EternalFitnessLogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

/**
 * Eternal Fitness logo — final identity, July 2026.
 *
 * Solid rose heart beside the justified two-line wordmark: ETERNAL
 * (DM Sans 800, ink/white) over FITNESS (DM Sans 500, rose), both
 * words exactly equal in width. Letter-spacing values are derived
 * from DM Sans font metrics (see EF_Brand_Guidelines_Jul2026.md) —
 * do not adjust them by eye.
 *
 * Master files: Assets/Brand-Pack-Jul2026/svg/
 */
const EternalFitnessLogo = ({
  className = "",
  variant = "light",
  size = "md",
}: EternalFitnessLogoProps) => {
  const isLight = variant === "light";
  const wordmarkColor = isLight ? "#FFFFFF" : "#131313";
  const roseColor = "#C1839F";

  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto",
  };

  return (
    <svg
      viewBox="0 0 142 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${sizeClasses[size]}`}
      aria-label="Eternal Fitness"
      role="img"
    >
      {/* The solid rose heart — the brand's one mark */}
      <path
        d="M18 29.5 C10.5 23.8 4.5 18.5 4.5 12.8 C4.5 8.3 7.9 5.3 11.8 5.3 C14.4 5.3 16.8 6.8 18 9.2 C19.2 6.8 21.6 5.3 24.2 5.3 C28.1 5.3 31.5 8.3 31.5 12.8 C31.5 18.5 25.5 23.8 18 29.5 Z"
        fill={roseColor}
        transform="translate(3,6) scale(0.78)"
      />

      {/* Justified word block — ETERNAL and FITNESS are equal width */}
      <text
        x="42"
        y="17"
        fontFamily="var(--font-dm-sans), 'DM Sans', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="15"
        letterSpacing="4.3"
        fill={wordmarkColor}
      >
        ETERNAL
      </text>
      <text
        x="42"
        y="34"
        fontFamily="var(--font-dm-sans), 'DM Sans', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="500"
        fontSize="10.5"
        letterSpacing="8.67"
        fill={roseColor}
      >
        FITNESS
      </text>
    </svg>
  );
};

export default EternalFitnessLogo;
