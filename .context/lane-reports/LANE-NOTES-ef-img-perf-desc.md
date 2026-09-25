# Lane notes — ef-img-perf-desc

## What was done

### Part 1 — BUG-EF-212: images slow to load

1. **next.config.js**: Dropped `image/avif` from formats (AVIF encode = 4–6s per image on cold cache; WebP is ~10× faster). Added `minimumCacheTTL: 2592000` (30 days). Reduced `deviceSizes` to `[640, 828, 1080, 1280, 1600, 1920]` — originals are not wider than 1920px.

2. **scripts/resize-public-images.mjs**: Node ESM script using sharp. Walks `public/images` recursively; resizes images wider than 2000px to 2000px wide; re-encodes oversized jpg/png files even if width is fine. 14 images resized. Output pasted below.

3. **Hero priority/sizes**: `app/HomePageClient.tsx:28-39` already has `priority` and `sizes="100vw"` — no change needed.

### Part 2 — BUG-EF-211: "Describe this image" strip under full-bleed images

For full-bleed background images, the `<details className="ef-desc">` was placed after `</section>`, creating a loose white strip below the hero/CTA band. Moved it inside the `<section>` with `ef-desc--overlay` class so it renders as a corner pill over the image.

**Files changed:**
- `app/design-system.css` — added `ef-desc--overlay` and `ef-desc--overlay-left` CSS rules
- `components/ds/PageHero.tsx` — overlay layout: moved `<details>` inside `<section>`, added `ef-desc--overlay`
- `components/ds/CTABand.tsx` — overlay layout: moved `<details>` inside `<section>`, added `ef-desc--overlay`
- `app/HomePageClient.tsx` — `#hero` section: moved `<details>` inside `<section>`, uses `ef-desc--overlay-left` (avoids `.h-badge` overlap); `#cta` section: moved `<details>` inside `<section>`, uses `ef-desc--overlay`

**Left as-is (contained images):** All `ef-desc` in `app/about/`, `app/contact/`, `app/personal-training/`, `app/specialist-training/` — these are inside `<figure className="ef-figure">` or split layouts, which is correct per the brief.

**All `imageDescription` props** in PageHero/CTABand across other pages automatically get the overlay treatment via the updated components.

### Resize script output

```
  File                                                        Before    After     Dimensions (before -> after)
  --------------------------------------------------------------------------------------------------------------------
  about-quals-barbell-hands.jpg                                  501 KB    358 KB    2400x1600 -> 2000x1333
  about-story-deadlift.jpg                                       401 KB    293 KB    2400x1600 -> 2000x1333
  about-studio-band-stretch.jpg                                  411 KB    298 KB    2400x1600 -> 2000x1333
  approach-step1-plank-coaching.jpg                              343 KB    245 KB    2400x1600 -> 2000x1333
  approach-step1.jpg                                             405 KB    274 KB    1537x1023 -> 1537x1023
  approach-step3-deadlift-clients.jpg                            453 KB    326 KB    2400x1600 -> 2000x1333
  coaching-bench-press-spot.jpg                                  299 KB    225 KB    2400x1600 -> 2000x1333
  cta-gym.jpg                                                     22 KB      7 KB    3120x1198 -> 2000x768
  pricing-hero-coaching.jpg                                      427 KB    309 KB    2400x1600 -> 2000x1333
  pricing-studio.jpg                                             385 KB    280 KB    2400x1600 -> 2000x1333
  specialist-training-esther-client.jpg                          414 KB    354 KB    1600x2400 -> 1600x2400
  strength-tasks.jpg                                             405 KB    274 KB    1537x1023 -> 1537x1023
  studio-fixed-positions.jpg                                     229 KB    219 KB    2048x1073 -> 2000x1048
  why-coaching-review.jpg                                        368 KB    269 KB    2400x1615 -> 2000x1346

Resized 14 image(s).
```

### Notes

- The resize script was run from a sibling worktree (`ef-medical-conditions-page`) because this worktree's pnpm junction doesn't resolve sharp for standalone Node ESM scripts. The resized images were then copied back. The script itself is correct and portable — it just needs a working sharp installation.
- `tsc --noEmit` passes cleanly (0 errors).
