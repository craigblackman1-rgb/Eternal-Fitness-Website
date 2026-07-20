import { buildBrandedUpdateEmail } from "./shell";

const ROSE = "#C1839F";

export interface DocumentReadyInput {
  clientName: string;
  /** Name used in the "Hi …," greeting. Defaults to clientName. */
  greetingName?: string;
  documentTitle: string;
  /** Absolute URL the client clicks to read and sign. */
  signUrl: string;
}

/**
 * Email sent to a client when a document is ready for them to review and sign.
 * Reuses the shared branded shell; the primary CTA is a rose, rounded button
 * linking to the sign URL.
 */
export function buildDocumentReadyEmail(input: DocumentReadyInput): string {
  const greeting = (input.greetingName ?? "").trim() || input.clientName;
  const signUrl = input.signUrl;
  return buildBrandedUpdateEmail({
    documentTitle: input.documentTitle,
    previewText: "A document is ready for you to review and sign.",
    title: "A document is ready for you",
    subtitle: "From Eternal Fitness",
    greetingName: greeting,
    introHtml: `<p style="margin:0;">I've prepared <strong>${input.documentTitle}</strong> for you. Please read it through and add your signature using the button below — it only takes a moment.</p>`,
    sections: [
      {
        label: "What to do",
        color: ROSE,
        html: `<p style="margin:0;">Open the document, review the details, and sign where indicated. If anything's unclear, just reply and let me know.</p>`,
      },
    ],
    psHtml: `<p style="margin:0;">You can also open the link on your phone — tap the button and sign on the go.</p>`,
  });
}

export { ROSE };
