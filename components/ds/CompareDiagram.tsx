import { IconX, IconCheck } from "@/components/icons";

interface CompareSide {
  label: string;
  items: string[];
}

interface CompareDiagramProps {
  negative: CompareSide;
  positive: CompareSide;
  /** short badge between the two panels */
  vs?: string;
}

/** Before/after contrast diagram — two panels with a VS badge between them. */
export function CompareDiagram({ negative, positive, vs = "vs" }: CompareDiagramProps) {
  return (
    <div className="ds-compare">
      <div className="ds-compare-col ds-compare-neg">
        <div className="ds-compare-label">{negative.label}</div>
        {negative.items.map((item) => (
          <div key={item} className="ds-compare-item">
            <IconX className="w-4 h-4 ds-compare-ic ds-compare-ic-x" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="ds-compare-vs" aria-hidden>
        <span>{vs}</span>
      </div>
      <div className="ds-compare-col ds-compare-pos">
        <div className="ds-compare-label">{positive.label}</div>
        {positive.items.map((item) => (
          <div key={item} className="ds-compare-item">
            <IconCheck className="w-4 h-4 ds-compare-ic ds-compare-ic-check" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompareDiagram;
