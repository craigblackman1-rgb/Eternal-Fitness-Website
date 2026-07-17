import { buildBrandedUpdateEmail } from "./shell";

const ROSE = "#C1839F";
const TEAL = "#087E8B";
const BODY_COLOR = "#525A61";

export interface FourWeekUpdateData {
  clientName: string;
  /** Name used in the "Hi …," greeting. Defaults to clientName (use a first name). */
  greetingName?: string;
  /** Opening paragraph text (plain text; wrapped in <p>). Defaults to the standard line. */
  introText?: string;
  attendanceSection: string;
  bigWinSection: string;
  highlightsSection: string;
  whatEverySessionSection: string;
  keepAnEyeOnSection: string;
  whatsNextSection: string;
  worthSayingSection: string;
  /** Optional P.S. block after the sign-off. */
  psSection?: string;
}

export const DEFAULT_INTRO = "I wanted to take a moment to look back over the last 4 weeks.";

export function buildFourWeekUpdateHtml(data: FourWeekUpdateData): string {
  const intro = (data.introText ?? "").trim() || DEFAULT_INTRO;
  return buildBrandedUpdateEmail({
    documentTitle: "Your last 4 weeks with me",
    previewText: "A short update on how the last four weeks have gone — and what's next.",
    title: "Your last 4 weeks",
    subtitle: "A training update from Esther",
    greetingName: (data.greetingName ?? "").trim() || data.clientName,
    introHtml: `<p style="margin:0;">${intro}</p>`,
    sections: [
      { label: "Attendance &amp; Consistency", color: ROSE, html: data.attendanceSection },
      { label: "The Big Win This Block", color: TEAL, html: data.bigWinSection },
      { label: "Strength &amp; Fitness Highlights", color: ROSE, html: data.highlightsSection },
      { label: "What Every Session Is Actually Doing", color: TEAL, html: data.whatEverySessionSection },
      { label: "A Couple of Things to Keep an Eye On", color: ROSE, html: data.keepAnEyeOnSection },
      { label: "What's Next for You", color: TEAL, html: data.whatsNextSection },
      { label: "Worth Saying&hellip;", color: BODY_COLOR, html: data.worthSayingSection },
    ],
    psHtml: data.psSection,
  });
}
