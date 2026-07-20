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
}: {
  body: DocumentBody;
  consentChoices?: Record<string, boolean>;
  onConsentChange?: (key: string, value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      {body.intro && (
        <div
          className="text-sm leading-relaxed text-[#525A61] [&_strong]:text-[#1E1E1E]"
          dangerouslySetInnerHTML={{ __html: body.intro }}
        />
      )}
      {body.sections.map((s) => (
        <section key={s.id} aria-labelledby={`sec-${s.id}`}>
          <h3 id={`sec-${s.id}`} className="text-base font-bold text-[#1E1E1E] mb-2 pb-1.5 border-b border-[#E5E5E5]">
            {s.title}
          </h3>
          <div
            className="text-sm leading-relaxed text-[#525A61] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_li]:mb-1 [&_p]:mb-2 [&_a]:text-[#087E8B] [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:text-left [&_th]:bg-[#F5F5F5] [&_th]:p-2 [&_th]:border [&_th]:border-[#E5E5E5] [&_th]:text-[#1E1E1E] [&_td]:p-2 [&_td]:border [&_td]:border-[#E5E5E5] [&_td]:align-top"
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
    <div className="space-y-6">
      {groups.map((group) => (
        <fieldset key={group.id} className="border-0 p-0 m-0">
          <legend className="text-sm font-semibold text-charcoal mb-3">{group.legend}</legend>
          <div className="space-y-2">
            {group.options.map((opt) => (
              <label key={opt.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!choices[opt.key]}
                  onChange={(e) => onChange(opt.key, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded accent-rose"
                />
                <span className="text-sm text-[#525A61]">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
