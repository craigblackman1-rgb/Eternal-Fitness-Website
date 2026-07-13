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
  const eternalColor = isLight ? "#FFFFFF" : "#2D3436";
  const roseColor = "#C1839F";

  const sizeClasses = {
    sm: "h-9 w-auto",
    md: "h-12 w-auto",
    lg: "h-16 w-auto",
  };

  return (
    <svg
      viewBox="0 0 200 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${sizeClasses[size]}`}
      aria-label="Eternal Fitness"
      role="img"
    >
      {/* The Emblem — chosen mark from Assets/logo-options-jul2026/ef-logo-d-emblem.svg:
          a single rose petal above a stacked, wide-tracked wordmark. */}
      <path
        d="M18 29.5 C10.5 23.8 4.5 18.5 4.5 12.8 C4.5 8.3 7.9 5.3 11.8 5.3 C14.4 5.3 16.8 6.8 18 9.2 C19.2 6.8 21.6 5.3 24.2 5.3 C28.1 5.3 31.5 8.3 31.5 12.8 C31.5 18.5 25.5 23.8 18 29.5 Z"
        fill={roseColor}
        transform="translate(82,4)"
      />
      <text
        x="103"
        y="78"
        textAnchor="middle"
        fontFamily="var(--font-dm-sans), 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="7"
        fill={eternalColor}
      >
        ETERNAL
      </text>
      <text
        x="103"
        y="102"
        textAnchor="middle"
        fontFamily="var(--font-dm-sans), 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="500"
        fontSize="12"
        letterSpacing="7.5"
        fill={roseColor}
      >
        FITNESS
      </text>
    </svg>
  );
};

export default EternalFitnessLogo;
