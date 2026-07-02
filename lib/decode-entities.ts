/**
 * Blog content is stored with HTML entities encoded (legacy WP import);
 * titles/excerpts are rendered as plain text, so decode the common
 * entities before display or they show literally ("Exercise &amp; Illness").
 */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&#8217;": "’",
  "&#8216;": "‘",
  "&#8220;": "“",
  "&#8221;": "”",
  "&#8211;": "–",
  "&#8212;": "—",
};

export function decodeEntities(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/&(?:#\d+|[a-z]+);/gi, (m) => ENTITIES[m] ?? m);
}
