const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

/**
 * Blog excerpts are raw truncated post body (not authored meta copy), so they
 * routinely run 199-200 chars — past Google's ~155-160 char display limit —
 * and can carry stray HTML entities (e.g. "&nbsp;") that render literally in
 * search snippets. This cleans and re-truncates at a word boundary without
 * touching the underlying excerpt/content in the DB.
 */
export function cleanMetaDescription(raw: string, maxLength = 155): string {
  let text = raw.replace(/<[^>]+>/g, "");
  text = text.replace(/&nbsp;|&amp;|&quot;|&#39;|&apos;|&lt;|&gt;/g, (m) => HTML_ENTITIES[m] ?? m);
  text = text.replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const clean = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).replace(/[.,;:!?]*$/, "");
  return `${clean}…`;
}
