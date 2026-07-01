/** Infinite rose marquee strip — mirrors the homepage .tstrip. */
export function Ticker({ items }: { items: string[] }) {
  return (
    <div className="ds-ticker">
      <div className="ds-ticker-track">
        {[0, 1].map((dup) => (
          <span key={dup} style={{ display: "flex" }}>
            {items.map((item, i) => (
              <span key={`${dup}-${i}`} style={{ display: "flex" }}>
                <span className="ds-ticker-item">{item}</span>
                <span className="ds-ticker-item ds-ticker-star">✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Ticker;
