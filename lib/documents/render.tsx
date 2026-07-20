import type { DocumentBody, ConsentGroup } from "./types";

/**
 * Renders a document body (intro + sections) as branded, read-only HTML.
 * Section HTML is authored by Esther in the template editor, so it is rendered
 * with dangerouslySetInnerHTML — same trust model as the PAR-Q/agreement copy.
 *
 * If `consentGroups` are present and `onConsentChange` is supplied, the groups
 * render as REAL interactive checkboxes (React state) rather than static HTML.
 */
export function DocumentBodyView({
  body,
  consentChoices,
  onConsentChange,
  startIndex = 1,
}: {
  body: DocumentBody;
  consentChoices?: Record<string, boolean>;
  onConsentChange?: (key: string, value: boolean) => void;
  /** Number the first section starts at (used so refreshed docs continue the count). */
  startIndex?: number;
}) {
  return (
    <div className="doc-prose">
      {body.intro && (
        <div
          className="doc-standfirst"
          dangerouslySetInnerHTML={{ __html: body.intro }}
        />
      )}
      {body.sections.map((s, i) => (
        <section key={s.id} className="doc-section" aria-labelledby={`sec-${s.id}`}>
          <p className="doc-section__num">
            {String(startIndex + i).padStart(2, "0")}
          </p>
          <h2 id={`sec-${s.id}`} className="doc-section__title">
            {s.title}
          </h2>
          <div
            className="doc-section__intro"
            dangerouslySetInnerHTML={{ __html: s.html }}
          />
        </section>
      ))}

      {body.consentGroups && onConsentChange && (
        <ConsentGroupsView groups={body.consentGroups} choices={consentChoices ?? {}} onChange={onConsentChange} />
      )}
    </div>
  );
}

function ConsentGroupsView({
  groups,
  choices,
  onChange,
}: {
  groups: ConsentGroup[];
  choices: Record<string, boolean>;
  onChange: (key: string, value: boolean) => void;
}) {
  return (
    <div className="doc-consent-groups">
      {groups.map((group) => (
        <fieldset key={group.id} className="doc-consent-fieldset">
          <legend className="check-group-legend">{group.legend}</legend>
          <div className="doc-consent-options">
            {group.options.map((opt) => (
              <label key={opt.key} className="consent">
                <input
                  type="checkbox"
                  checked={!!choices[opt.key]}
                  onChange={(e) => onChange(opt.key, e.target.checked)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
