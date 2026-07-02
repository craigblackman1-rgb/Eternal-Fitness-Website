# Brief: vary section rhythm on 5 more pages

HARD CONSTRAINTS: no installs, no builds, no git, no deploys. Do NOT change any copy text — every string stays verbatim (move strings, never rewrite them). Only restructure JSX using components already exported from `@/components/ds` (Section, SectionHeading, FeatureCard, ProcessFlow, CompareDiagram, StatStrip, NumberedSteps, Callout, Reveal, CtaButton) and CSS classes in app/design-system.css. Remove imports that become unused. TypeScript must stay valid.

Reference for the target rhythm: `app/personal-training/PersonalTrainingClient.tsx` (just rebuilt) and `app/exercise-for-health/visual-impairment/VisualImpairmentClient.tsx`. Design rule: **no two adjacent sections may use the same archetype; max ONE icon-card grid (ds-grid-2/3 of icon FeatureCards) per page.**

ProcessFlow usage: `<ProcessFlow steps={items.map((s) => ({ title: s.title, body: s.desc }))} />` (drop icon fields + their unused imports). NumberedSteps usage: `<NumberedSteps steps={[{title, body, image?, imageAlt?}]} />`.

## 1. app/about/AboutPageClient.tsx
- "Qualifications" section (cream, ds-grid-3 icon cards): keep heading; replace the icon-card grid with a `ds-featlist` (rows: `ds-feat` > `ds-feat-dot` + `ds-feat-t`/`ds-feat-c`) inside a `ds-split` with an image on the right — use `/images/esther-training.jpg` (fill, sizes="(max-width: 1000px) 100vw, 50vw", objectFit cover, wrapped in `<Reveal y={40} className="ds-split-img">`).
- "Long-Term Progress" section (cream, ds-grid-3): convert its items to `<ProcessFlow>` (3 steps).
- Leave "My Story", "Experience", "Philosophy", "Studio" sections as they are.
- After the change, verify backgrounds still alternate white/cream down the page; adjust `background` props if two same-background sections end up adjacent.

## 2. app/exercise-for-health/ExerciseForHealthClient.tsx
- "Conditions Covered" grid (cream, ds-grid-3): KEEP — this is the page's one allowed icon-card grid.
- "What to Expect from Your Sessions" (white, ds-grid-3): convert to `<ProcessFlow>` (its items are sequential steps).
- "Common Questions" (cream, ds-grid-2 icon cards): convert to a `ds-featlist` two-column layout: wrap in `<div className="ds-grid-2">` with two `ds-featlist` columns (split the FAQ array in half), each row `ds-feat` with dot + `ds-feat-t` (question) + `ds-feat-c` (answer). No icons.

## 3. app/cancer-rehabilitation/CancerRehabClient.tsx
- "Support at Every Stage" (cream, ds-grid-3): KEEP as the one icon-card grid BUT switch each card to the image-top FeatureCard variant if the items are exactly 3 stages — use images `/images/specialise-1.jpg`, `/images/mind-body.jpg`, `/images/strength-tasks.jpg` in that order (pass `image` + `imageAlt`={title}, drop `icon`).
- "What I Know and How I Work" (white, ds-grid-2): convert to `ds-split`: left = SectionHeading + `ds-featlist` of the items; right = `<Reveal y={40} className="ds-split-img">` image `/images/who-health.jpg`.
- "Common Questions" (cream, ds-grid-2): same two-column `ds-featlist` FAQ treatment as page 2.
- Insert a `<Section background="white"><StatStrip background="ink" stats={[{value:"L4",label:"Cancer rehabilitation qualified"},{value:"1:1",label:"Private one-to-one sessions only"},{value:"30 min",label:"Free, no-pressure consultation"},{value:"Worthing",label:"Private studio, West Sussex"}]} /></Section>` between "What I Know" and "Common Questions" (adjust neighbouring backgrounds so alternation holds).

## 4 & 5. bone-health/BoneHealthClient.tsx and high-blood-pressure/HighBloodPressureClient.tsx (same pattern each)
- "The Approach" (ds-grid-3): KEEP as the page's one icon-card grid.
- "Session Structure" (ds-grid-3): convert to `<ProcessFlow>` — these items describe a session sequence.
- "Common Questions" (ds-grid-2): two-column `ds-featlist` FAQ treatment as above.
- Fix background alternation if needed.

## Acceptance
- Copy diff-identical (structure-only changes)
- No unused imports; type-correct
- No page has two adjacent sections with the same archetype; max one icon-card grid per page
