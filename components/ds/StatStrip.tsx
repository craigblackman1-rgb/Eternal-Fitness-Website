import { Reveal } from "./Reveal";
import type { IconComponent } from "./types";

export interface Stat {
  value: string;
  label: string;
  icon?: IconComponent;
}

/** Credentials / facts strip — a compact infographic band of key figures. */
export function StatStrip({ stats, background = "ink" }: { stats: Stat[]; background?: "ink" | "teal" }) {
  return (
    <Reveal className={`ds-statstrip ds-bg-${background}`} stagger={0.1} y={30} start="top 88%" style={{ ["--ds-stat-count" as string]: stats.length }}>
      {stats.map((s) => (
        <div key={s.label} className="ds-stat">
          {s.icon && (
            <span className="ds-stat-ic">
              <s.icon className="w-5 h-5" />
            </span>
          )}
          <div className="ds-stat-v">{s.value}</div>
          <div className="ds-stat-l">{s.label}</div>
        </div>
      ))}
    </Reveal>
  );
}

export default StatStrip;
