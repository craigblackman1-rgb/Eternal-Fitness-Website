interface StatBadgeProps {
  /** short value shown in the circle / large numeral, e.g. "L4" or "4" */
  value: string;
  label: string;
  sublabel?: string;
  variant?: "white" | "rose";
  className?: string;
}

/** Floating credential badge — mirrors the homepage hero/why badges. */
export function StatBadge({ value, label, sublabel, variant = "white", className }: StatBadgeProps) {
  if (variant === "rose") {
    return (
      <div className={`ds-badge-rose ${className ?? ""}`}>
        <div className="ds-badge-num">{value}</div>
        <div className="ds-badge-lbl">{label}</div>
      </div>
    );
  }
  return (
    <div className={`ds-badge ${className ?? ""}`}>
      <div className="ds-badge-circle">{value}</div>
      <div>
        <div className="ds-badge-t">{label}</div>
        {sublabel && <div className="ds-badge-s">{sublabel}</div>}
      </div>
    </div>
  );
}

export default StatBadge;
