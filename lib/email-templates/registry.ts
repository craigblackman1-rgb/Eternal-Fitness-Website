export interface UpdateTemplateSection {
  key: string;
  label: string;
}

export interface UpdateTemplateKind {
  id: string;
  label: string;
  defaultSubject: string;
  sections: UpdateTemplateSection[];
  starterPrompts: string[];
}

/**
 * Named update template kinds. Each kind's branded HTML is built via the shared
 * shell (lib/email-templates/shell.ts) — adding a new kind means adding an entry
 * here plus a generator function (see lib/generate-six-week-update.ts for the
 * pattern), not rebuilding the email chrome.
 */
export const UPDATE_TEMPLATE_KINDS: UpdateTemplateKind[] = [
  {
    id: "six_week_update",
    label: "6-Week Update",
    defaultSubject: "Your last 6 weeks with me 🏋️",
    sections: [
      { key: "attendanceSection", label: "Attendance & Consistency" },
      { key: "bigWinSection", label: "The Big Win This Block" },
      { key: "highlightsSection", label: "Strength & Fitness Highlights" },
      { key: "whatsNextSection", label: "What's Next for You" },
      { key: "worthSayingSection", label: "Worth Saying" },
      { key: "psSection", label: "P.S. — note after sign-off (optional)" },
    ],
    starterPrompts: [
      "How has attendance and consistency been this block?",
      "What's the single biggest win this block?",
      "What strength/fitness wins should we highlight?",
      "What's the focus for the next block?",
    ],
  },
];

export function getTemplateKind(id: string): UpdateTemplateKind {
  return UPDATE_TEMPLATE_KINDS.find((k) => k.id === id) ?? UPDATE_TEMPLATE_KINDS[0];
}
