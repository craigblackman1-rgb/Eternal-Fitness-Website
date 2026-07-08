"use client";

import { useState } from "react";
import Link from "next/link";
import type { Accent, IconComponent } from "./types";

export interface IndexItem {
  title: string;
  body: string;
  icon?: IconComponent;
  cta?: { label: string; href?: string; onClick?: () => void };
}

interface IndexListProps {
  items: IndexItem[];
  accent?: Accent;
  /** small uppercase label above the active title in the detail panel */
  panelEyebrow?: string;
}

function IndexCta({ cta, accent }: { cta: NonNullable<IndexItem["cta"]>; accent: Accent }) {
  const className = `ds-index-cta ds-index-cta-${accent}`;
  if (cta.href) {
    return (
      <Link href={cta.href} className={className}>
        {cta.label} <span aria-hidden>→</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={cta.onClick} className={className}>
      {cta.label} <span aria-hidden>→</span>
    </button>
  );
}

/**
 * Editorial index — replaces card grids for enumerable content (conditions,
 * services). Desktop: large typographic list on the left, sticky detail panel
 * on the right, activated on hover/focus. Mobile: collapses to an accordion.
 */
export function IndexList({ items, accent = "rose", panelEyebrow }: IndexListProps) {
  const [active, setActive] = useState(0);
  const [openMobile, setOpenMobile] = useState<number | null>(0);

  const activeItem = items[active];
  const ActiveIcon = activeItem?.icon;

  return (
    <div className="ds-index">
      <div className="ds-index-list">
        {items.map((item, i) => {
          const isActive = i === active;
          const isOpen = openMobile === i;
          return (
            <div
              key={item.title}
              className={`ds-index-row${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="ds-index-rowbtn"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => {
                  setActive(i);
                  setOpenMobile(isOpen ? null : i);
                }}
                aria-expanded={isOpen}
              >
                <span className="ds-index-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="ds-index-t">{item.title}</span>
                <svg className="ds-index-chev" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 5.5L7 9.5L11 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="ds-index-inline">
                <div className="ds-index-inline-inner">
                  <p>{item.body}</p>
                  {item.cta && <IndexCta cta={item.cta} accent={accent} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ds-index-panel" aria-live="polite">
        {activeItem && (
          <div className="ds-index-panelcard" key={activeItem.title}>
            {ActiveIcon && (
              <div className={`ds-card-ic ds-card-ic-${accent === "rose" ? "rose" : "teal"}`}>
                <ActiveIcon className="w-5 h-5" />
              </div>
            )}
            {panelEyebrow && <span className="ds-index-panel-eyebrow">{panelEyebrow}</span>}
            <h3>{activeItem.title}</h3>
            <p>{activeItem.body}</p>
            {activeItem.cta && <IndexCta cta={activeItem.cta} accent={accent} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default IndexList;
