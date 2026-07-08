# Brief: blog entity/sidebar fixes + contact map replacement

HARD CONSTRAINTS: no installs, no builds, no git, no deploys. TypeScript must stay valid; remove imports that become unused.

A helper now exists: `import { decodeEntities } from "@/lib/decode-entities";`

## 1. app/blog/BlogPageClient.tsx
- Wrap every rendered post `title` and `excerpt` with `decodeEntities(...)` (BlogCard, FeaturedCard, anywhere else titles/excerpts print). Do NOT touch `content` rendering.
- The hero `<img src="/images/blog-hero.jpg" ...>`: change src to `/images/studio-1.jpg` (the current photo is off-brand).

## 2. app/blog/[slug]/BlogPostClient.tsx
- Wrap all rendered `title` and `excerpt` values (header h2, Related, Recent, Featured, Popular, share links' encodeURIComponent title, and the "In this article" TOC labels if they derive from title/headings) with `decodeEntities(...)`.
- Delete the entire "Recent Articles" sidebar block (it duplicates Related Articles) — the `<h4>Recent Articles</h4>` card around lines 226–240 including its wrapper. Remove the now-unused `recentPosts` prop from this component's props/interface AND from where the parent `app/blog/[slug]/page.tsx` passes it (also remove the `recentPosts` computation there if now unused).

## 3. app/blog/[slug]/page.tsx
- Also wrap `post.title` / `post.excerpt` used in `generateMetadata` and the JSON-LD articleSchema with `decodeEntities(...)`.

## 4. app/contact/ContactPageClient.tsx — replace the empty map box
- In the "Find the Studio" section (`id="map"`), the map placeholder renders as an empty beige rounded box. Replace that placeholder element with a two-image grid using the existing image-card language:
```tsx
<div className="ds-grid-2" style={{ marginTop: 48 }}>
  <div className="ds-split-img" style={{ aspectRatio: "16/10" }}>
    <Image src="/images/studio-1.jpg" alt="Inside the private Eternal Fitness studio in Worthing" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
  </div>
  <div className="ds-split-img" style={{ aspectRatio: "16/10" }}>
    <Image src="/images/studio-2.jpg" alt="Training equipment at the Eternal Fitness studio" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
  </div>
</div>
```
Import `Image` from `next/image` if not already. Keep the section heading and intro copy exactly as-is. Remove whatever empty placeholder markup/iframe the box currently is.

## Acceptance
- No copy changes beyond removing the duplicated sidebar block; entities decode; contact map box replaced with studio photos; type-correct.
