import { buildBrandedUpdateEmail } from "./shell";

const ROSE = "#C1839F";
const TEAL = "#087E8B";
const BODY_COLOR = "#525A61";
const SECTION_COLORS = [ROSE, TEAL, BODY_COLOR];

export interface FlexibleSection {
  heading: string;
  html: string;
}

export interface FlexibleUpdateData {
  clientName: string;
  /** Name used in the "Hi …," greeting. Defaults to clientName (use a first name). */
  greetingName?: string;
  /** Opening paragraph text (plain text; wrapped in <p>). Defaults to the standard line. */
  introText?: string;
  title?: string;
  subtitle?: string;
  /** Ordered, freeform sections. Entries with no heading and no body are skipped. */
  sections: FlexibleSection[];
  /** Optional P.S. block after the sign-off. */
  psSection?: string;
}

export const DEFAULT_TITLE = "Your Training Update";
export const DEFAULT_SUBTITLE = "A training update from Esther";
export const DEFAULT_INTRO = "I'd like to take a moment to look back over your training.";

export function buildFlexibleUpdateHtml(data: FlexibleUpdateData): string {
  const intro = (data.introText ?? "").trim() || DEFAULT_INTRO;
  const title = (data.title ?? "").trim() || DEFAULT_TITLE;
  const subtitle = (data.subtitle ?? "").trim() || DEFAULT_SUBTITLE;
  const sections = (data.sections ?? [])
    .filter((s) => (s.heading ?? "").trim() || (s.html ?? "").trim())
    .map((s, i) => ({
      label: s.heading || "",
      color: SECTION_COLORS[i % SECTION_COLORS.length],
      html: s.html || "",
    }));

  return buildBrandedUpdateEmail({
    documentTitle: title,
    previewText: "A short update on how things have gone — and what's next.",
    title,
    subtitle,
    greetingName: (data.greetingName ?? "").trim() || data.clientName,
    introHtml: `<p style="margin:0;">${intro}</p>`,
    sections,
    psHtml: data.psSection,
  });
}
