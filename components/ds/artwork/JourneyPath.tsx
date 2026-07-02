/**
 * Journey path — a gently meandering dotted route with milestone nodes,
 * like a recovery journey drawn on a map. Sized to sit behind or beside
 * content as a decorative accent. Decorative only: aria-hidden.
 */
interface JourneyPathProps {
  accent?: "rose" | "teal" | "white";
  /** number of milestone dots along the path (2–5) */
  milestones?: number;
  className?: string;
}

const C = {
  rose: { path: "rgba(193,131,159,.5)", node: "#C1839F", ring: "rgba(193,131,159,.25)" },
  teal: { path: "rgba(8,126,139,.45)", node: "#087E8B", ring: "rgba(8,126,139,.2)" },
  white: { path: "rgba(255,255,255,.4)", node: "#fff", ring: "rgba(255,255,255,.25)" },
};

// fixed bezier route; milestone positions sampled along it
const NODES = [
  { x: 24, y: 128 },
  { x: 120, y: 96 },
  { x: 216, y: 112 },
  { x: 312, y: 56 },
  { x: 396, y: 28 },
];

export function JourneyPath({ accent = "rose", milestones = 4, className }: JourneyPathProps) {
  const c = C[accent];
  const shown = NODES.slice(0, Math.max(2, Math.min(5, milestones + 1)));
  const last = shown[shown.length - 1];
  return (
    <svg
      viewBox="0 0 420 150"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <path
        d="M24 128 C 60 140, 90 84, 120 96 S 190 128, 216 112 S 280 44, 312 56 S 372 40, 396 28"
        stroke={c.path}
        strokeWidth="2"
        strokeDasharray="1 8"
        strokeLinecap="round"
      />
      {shown.map((n, i) => {
        const isLast = i === shown.length - 1;
        return (
          <g key={i}>
            {isLast && <circle cx={n.x} cy={n.y} r="12" fill="none" stroke={c.ring} strokeWidth="2" />}
            <circle cx={n.x} cy={n.y} r={isLast ? 5.5 : 4} fill={isLast ? c.node : "#fff"} stroke={c.node} strokeWidth="2" />
          </g>
        );
      })}
      {/* flag on the final node */}
      <path d={`M ${last.x} ${last.y - 12} v -14 h 13 l -4 4 4 4 h -13`} stroke={c.node} strokeWidth="1.8" strokeLinejoin="round" fill="none" opacity="0.85" />
    </svg>
  );
}

export default JourneyPath;
