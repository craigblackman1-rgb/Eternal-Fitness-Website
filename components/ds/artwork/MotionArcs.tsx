/**
 * Range-of-motion fan — a physio-style diagram of a limb moving through
 * an arc: solid line at the resting position, dashed ghost positions,
 * dotted arc tracing the range. Reads as "mobility restored".
 * Decorative only: aria-hidden.
 */
interface MotionArcsProps {
  accent?: "rose" | "teal";
  className?: string;
}

const C = {
  rose: { line: "#C1839F", soft: "rgba(193,131,159,.35)", dot: "#C1839F" },
  teal: { line: "#087E8B", soft: "rgba(8,126,139,.30)", dot: "#087E8B" },
};

export function MotionArcs({ accent = "teal", className }: MotionArcsProps) {
  const c = C[accent];
  // pivot at (30, 150); limb length 120; positions at -10°, 25°, 60°, 90°
  const pivot = { x: 30, y: 150 };
  const L = 120;
  const pos = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: pivot.x + L * Math.cos(rad), y: pivot.y - L * Math.sin(rad) };
  };
  const p0 = pos(5);
  const p1 = pos(35);
  const p2 = pos(65);
  const p3 = pos(92);
  return (
    <svg
      viewBox="0 0 200 170"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* ghost positions */}
      <line x1={pivot.x} y1={pivot.y} x2={p1.x} y2={p1.y} stroke={c.soft} strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <line x1={pivot.x} y1={pivot.y} x2={p2.x} y2={p2.y} stroke={c.soft} strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      {/* achieved position */}
      <line x1={pivot.x} y1={pivot.y} x2={p3.x} y2={p3.y} stroke={c.line} strokeWidth="2.5" strokeLinecap="round" />
      {/* resting position */}
      <line x1={pivot.x} y1={pivot.y} x2={p0.x} y2={p0.y} stroke={c.line} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      {/* arc tracing the range */}
      <path
        d={`M ${pos(8).x} ${pos(8).y} A ${L} ${L} 0 0 0 ${pos(89).x} ${pos(89).y}`}
        stroke={c.soft}
        strokeWidth="1.5"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      {/* pivot + endpoints */}
      <circle cx={pivot.x} cy={pivot.y} r="5" fill="#fff" stroke={c.line} strokeWidth="2" />
      <circle cx={p3.x} cy={p3.y} r="4" fill={c.dot} />
      <circle cx={p0.x} cy={p0.y} r="4" fill={c.dot} opacity="0.5" />
      {/* small progress arrow at top of arc */}
      <path d={`M ${pos(80).x - 7} ${pos(80).y + 2} L ${pos(86).x} ${pos(86).y} l 2 9`} stroke={c.line} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

export default MotionArcs;
