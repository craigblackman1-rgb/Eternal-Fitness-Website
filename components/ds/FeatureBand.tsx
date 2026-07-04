import Link from "next/link";
import type { Accent, IconComponent } from "./types";

export interface BandItem {
  title: string;
  body: string;
  icon?: IconComponent;
  href?: string;
  linkLabel?: string;
}

/**
 * Borderless typographic band — the card-free replacement for small
 * FeatureCard grids. Items sit on hairline top rules with serif titles;
 * optional icon renders as an oversized watermark-style mark.
 */
export function FeatureBand({ items, accent = "teal" }: { items: BandItem[]; accent?: Accent }) {
  return (
    <div className="ds-band">
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (
          <>
            {Icon && (
              <div className={`ds-band-ic ds-band-ic-${accent}`}>
                <Icon />
              </div>
            )}
            <h3 className="ds-band-t">{item.title}</h3>
            <p className="ds-band-b">{item.body}</p>
            {item.href && (
              <span className={`ds-index-cta ds-index-cta-${accent === "teal" ? "teal" : "rose"}`}>
                {item.linkLabel ?? "Learn more"} <span aria-hidden>→</span>
              </span>
            )}
          </>
        );
        return item.href ? (
          <Link key={item.title} href={item.href} className="ds-band-item ds-band-link">
            {inner}
          </Link>
        ) : (
          <div key={item.title} className="ds-band-item">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export default FeatureBand;
