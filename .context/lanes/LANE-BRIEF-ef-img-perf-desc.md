# Lane brief — ef-img-perf-desc (WO-EF-073, BUG-EF-211 + BUG-EF-212)

Worktree: `D:\apps\worktrees\eternal-fitness-website\ef-img-perf-desc` (branch `lane/ef-img-perf-desc`, off origin/main 3818605).
Do NOT run dev servers, browsers, or `pnpm install`. Do NOT push. Commit to this branch only, one commit per part.
When done, write `.context/lanes/LANE-REPORT-ef-img-perf-desc.md` listing every file changed and anything you could not do.

## Part 1 — BUG-EF-212: images slow to load

Measured on prod: `/_next/image` takes 4–6 s per image to encode AVIF on a cold cache (the cache is
wiped on every deploy), and responses are `max-age=60`. Fix in code:

1. `next.config.js` → `images`:
   - `formats: ["image/webp"]` (drop `image/avif` — AVIF encode is the 4–6 s cost; WebP is ~10× faster).
   - add `minimumCacheTTL: 2592000` (30 days).
   - add `deviceSizes: [640, 828, 1080, 1280, 1600, 1920]` (drops 2048/3840 — the originals are not that wide anyway).
   - Update the comment above to explain why (one or two lines).
2. Write `scripts/resize-public-images.mjs` (Node ESM, uses the already-installed `sharp`):
   - Walk `public/images` recursively; for every `.jpg/.jpeg/.png/.webp` wider than 2000 px, resize to 2000 px
     wide (keep aspect ratio, `withoutEnlargement`) and re-encode **in the same format and same filename**
     (jpeg: quality 82, mozjpeg; png: compressionLevel 9, palette false; webp: quality 82). Also re-encode any
     jpg/png over 400 KB even if not wider than 2000 px, but only keep the new file if it is smaller.
   - Print a table: file, before KB, after KB, before/after dimensions. Never rename or delete files.
   - Run it once and commit the resized images together with the script. Paste its output into the lane report.
3. Above-the-fold heroes: make sure the homepage hero `<Image>` in `app/HomePageClient.tsx` has `priority`
   and a `sizes` attribute matching its displayed width (it is full-bleed → `sizes="100vw"`). `PageHero`
   already uses `priority` — leave it.

## Part 2 — BUG-EF-211: "Describe this image" strip under full-bleed images

CR-EF-086 added `<details className="ef-desc">` disclosures. On **contained** images (split layouts,
figures) they are correct — leave those alone. On **full-bleed background images** they were placed
*after* the `</section>`, so a loose white "Describe this image" strip hangs under the hero / CTA band.
The canonical mockup (`D:\apps\design-systems\brand-staging-2662e9\image-treatment-plates.html`) never
puts the disclosure outside a full-bleed image.

Fix: for full-bleed cases only, move the `<details>` **inside** the `<section>` and give it the extra class
`ef-desc--overlay`, so it sits as a small pill in the image's bottom-right corner.

Cases to change (full-bleed branch only):
- `components/ds/PageHero.tsx` — the full-bleed branch (the `<details>` after `</section>`, around line 126). Not the split branch.
- `components/ds/CTABand.tsx` — the full-bleed branch (around line 53). Not the split branch.
- `app/HomePageClient.tsx` — the hero (`<details>` after the hero `</section>`, ~line 64) and the `#cta` section (~line 289).
- Grep the rest of `app/` for other `ef-desc` placed directly after a section whose image is a full-bleed
  background (`fill` + `objectFit: "cover"` covering the whole section) and apply the same treatment.
  List every one you changed or deliberately left in the report.

CSS — add to `app/design-system.css` directly after the existing `details.ef-desc` rules:

```css
/* Full-bleed images: the description sits over the image as a corner pill, not as a strip below it (BUG-EF-211) */
details.ef-desc.ef-desc--overlay {
  position: absolute; right: 16px; bottom: 16px; z-index: 5; margin: 0;
  max-width: min(380px, calc(100% - 32px));
  background: rgba(20, 16, 18, .78); border: 1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  color: #fff;
}
details.ef-desc.ef-desc--overlay summary { color: #fff; font-size: 12.5px; padding: 8px 14px; min-height: 44px; }
details.ef-desc.ef-desc--overlay summary::before { border-color: #fff; }
details.ef-desc.ef-desc--overlay summary:hover { background: rgba(255,255,255,.08); }
details.ef-desc.ef-desc--overlay[open] summary { border-bottom-color: rgba(255,255,255,.18); }
details.ef-desc.ef-desc--overlay p { color: rgba(255,255,255,.92); max-height: 40vh; overflow: auto; }
@media (max-width: 760px) {
  details.ef-desc.ef-desc--overlay { right: 12px; bottom: 12px; max-width: calc(100% - 24px); }
}
```

Make sure each affected `<section>` is `position: relative` (check its CSS class; most already are — add
`position: relative` to the class in CSS only if missing, never inline). If the homepage hero has a
bottom-right badge (`.h-badge`) that the pill would overlap, place the homepage-hero pill bottom-**left**
instead via an extra modifier class `ef-desc--overlay-left` (`right: auto; left: 16px;`) and say so in the report.

Keep the `<summary>` text exactly "Describe this image" and keep every description `<p>` text unchanged.

## Checks before you stop
- `npx tsc --noEmit` passes.
- `git status` clean after your commits; `git log --oneline origin/main..HEAD` shows your commits.
