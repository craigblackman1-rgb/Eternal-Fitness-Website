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
  const textColor = variant === "light" ? "#FFFFFF" : "#2D3436";
  const roseColor = "#C1839F";
  const tealColor = "#087E8B";
  const nearBlack = "#2D3436";

  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto",
  };

  return (
    <svg
      viewBox="0 0 280 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${sizeClasses[size]}`}
      aria-label="Eternal Fitness"
      role="img"
    >
      <defs>
        <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={roseColor} />
          <stop offset="100%" stopColor="#E8A87C" />
        </linearGradient>
        <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={tealColor} />
          <stop offset="100%" stopColor="#14A3B8" />
        </linearGradient>
        <linearGradient id="textGradientLight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F0F0" />
        </linearGradient>
        <linearGradient id="textGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={nearBlack} />
          <stop offset="100%" stopColor="#4A5258" />
        </linearGradient>
      </defs>

      {/* Symbol: Interlocking loops representing strength, continuity, and adaptability */}
      <g transform="translate(0, 4)">
        {/* Outer loop - strength/continuity */}
        <path
          d="M16 24 C16 14.7 24 8 34 8 C44 8 52 14.7 52 24 C52 33.3 44 40 34 40 C24 40 16 33.3 16 24 Z"
          stroke={variant === "light" ? "url(#roseGradient)" : roseColor}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Inner loop - adaptability/personalization */}
        <path
          d="M22 24 C22 17.3 27.3 12 34 12 C40.7 12 46 17.3 46 24 C46 30.7 40.7 36 34 36 C27.3 36 22 30.7 22 24 Z"
          stroke={variant === "light" ? "url(#tealGradient)" : tealColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="8 4"
        />
        {/* Center dot - the individual/client focus */}
        <circle
          cx="34"
          cy="24"
          r="3"
          fill={variant === "light" ? "url(#roseGradient)" : roseColor}
        />
      </g>

      {/* Wordmark: ETERNAL FITNESS */}
      <g transform="translate(64, 0)">
        <text
          x="0"
          y="32"
          fontFamily="'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="24"
          letterSpacing="2.5"
          fill={variant === "light" ? "url(#textGradientLight)" : "url(#textGradientDark)"}
        >
          ETERNAL
        </text>
        <text
          x="0"
          y="32"
          fontFamily="'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif"
          fontWeight="500"
          fontSize="11"
          letterSpacing="4"
          fill={variant === "light" ? "rgba(255,255,255,0.7)" : "rgba(45,52,54,0.6)"}
          transform="translate(128, -14)"
        >
          FITNESS
        </text>
        {/* Accent line under Fitness */}
        <line
          x1="128"
          y1="22"
          x2="198"
          y2="22"
          stroke={tealColor}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>

      {/* Tagline mark - small "est. 2024" or similar - optional */}
      {/* <text
        x="64"
        y="44"
        fontFamily="'DM Sans', sans-serif"
        fontWeight="400"
        fontSize="7"
        letterSpacing="1.5"
        fill={variant === "light" ? "rgba(255,255,255,0.5)" : "rgba(45,52,54,0.4)"}
        textTransform="uppercase"
      >
        Specialist Clinical & Adaptive Training
      </text> */}
    </svg>
  );
};

export default EternalFitnessLogo;