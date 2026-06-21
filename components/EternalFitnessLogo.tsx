interface EternalFitnessLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

const EternalFitnessLogo = ({ className = "", variant = "light" }: EternalFitnessLogoProps) => {
  const textColor = variant === "light" ? "#FFFFFF" : "#3C3C3C";
  const heartColor = "#FF5A5F"; // Design system rose
  const accentColor = "#087E8B"; // Brand teal

  return (
    <svg
      viewBox="0 0 220 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Eternal Fitness"
    >
      <text x="0" y="22" fontFamily="'DM Sans', sans-serif" fontWeight="700" fontSize="18" letterSpacing="3" fill={textColor}>ETERNAL</text>
      <g transform="translate(102, 6)">
        <path d="M8 14.5C8 14.5 1 10 1 5.5C1 3 3 1 5.5 1C6.8 1 7.6 1.8 8 2.3C8.4 1.8 9.2 1 10.5 1C13 1 15 3 15 5.5C15 10 8 14.5 8 14.5Z" fill={heartColor} />
      </g>
      <text x="122" y="22" fontFamily="'DM Sans', sans-serif" fontWeight="700" fontSize="18" letterSpacing="3" fill={textColor}>FITNESS</text>
      <line x1="0" y1="30" x2="220" y2="30" stroke={accentColor} strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
};

export default EternalFitnessLogo;
