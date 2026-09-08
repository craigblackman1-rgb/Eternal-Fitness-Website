import { redirect } from "next/navigation";

/**
 * CR-EF-136 u6 — the review/approve content has been folded into the block
 * page itself. This route now redirects to the parent, preserving any query
 * params so deep links and bookmarks continue to work.
 */
export default function ReviewRedirect({
  params,
  searchParams,
}: {
  params: { id: string; blockId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const base = `/hub/clients/${params.id}/blocks/${params.blockId}`;
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
