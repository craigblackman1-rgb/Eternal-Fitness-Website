import { redirect } from "next/navigation";

/**
 * u4 — the dated-block page is retired. The unified training model on the
 * client record replaces it. This route redirects to the client record,
 * preserving any query params so deep links and bookmarks continue to work.
 *
 * blocks/[blockId]/print/ is left untouched (printing is a separate route).
 */
export default function BlockRedirect({
  params,
  searchParams,
}: {
  params: { id: string; blockId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const base = `/hub/clients/${params.id}`;
  if (!searchParams || Object.keys(searchParams).length === 0) {
    redirect(base);
  }
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else if (value !== undefined) {
      qs.set(key, value);
    }
  }
  redirect(`${base}?${qs.toString()}`);
}
