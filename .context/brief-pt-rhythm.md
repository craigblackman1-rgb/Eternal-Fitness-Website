# Brief: vary section rhythm on /personal-training + homepage HowItWorks

Repo: this repo (Next.js 14 app router). HARD CONSTRAINTS: do NOT run installs, builds, deploys, git commands. Do NOT change any copy text — every string stays verbatim. Only restructure JSX using existing components from `@/components/ds` (see components/ds/index.ts) and existing CSS classes in app/design-system.css. TypeScript must stay valid.

## File 1: app/personal-training/PersonalTrainingClient.tsx

The page currently stacks four identical FeatureCard grids. Rebuild these sections (keep all other sections, the hero, CTABand, dialogs exactly as they are):

### A. "What I Work On" section (currently Section white + focusCards in ds-grid-2)
Replace the card grid with a split layout, image LEFT this time (the earlier "What to Expect" section has image right — mirror it):
```tsx
<Section background="white">
  <div className="ds-split">
    <Reveal y={40} className="ds-split-img">
      <Image src="/images/who-mobility.jpg" alt="Mobility and functional training" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
    </Reveal>
    <div>
      <SectionHeading eyebrow="What I Work On" eyebrowColor="teal" heading="Recovery and Rehabilitation for Real Life" intro={/* existing intro text verbatim */} />
      <div className="ds-featlist">
        {focusCards.map((c) => (
          <div key={c.title} className="ds-feat">
            <span className="ds-feat-dot" />
            <div>
              <div className="ds-feat-t">{c.title}</div>
              <div className="ds-feat-c">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</Section>
```

### B. "How It Works" section (currently cream + steps in ds-grid-2 FeatureCards)
Replace the grid with the ProcessFlow diagram (import ProcessFlow from "@/components/ds"):
```tsx
<Section background="cream">
  <SectionHeading align="center" eyebrow="The Process" heading="How It Works" />
  <div style={{ marginTop: 48 }}>
    <ProcessFlow steps={steps.map((s) => ({ title: s.title, body: s.desc }))} />
  </div>
  {/* keep the centred CtaButton below as-is */}
</Section>
```
(The `icon` field in `steps` becomes unused — remove the now-unused icon imports so lint passes.)

### C. "Condition-Specific Training" section (currently white + ds-grid-3 icon FeatureCards)
Switch the three cards to the image-top variant of FeatureCard (keep hrefs and copy):
- Exercise for Health → image "/images/services-training.jpg"
- Cancer Rehabilitation → image "/images/specialise-1.jpg"
- Visual Impairment → image "/images/specialise-3.jpg"
i.e. add `image` and `imageAlt` (use the title) to each item in `specialistPages` and pass them through; drop the `icon` prop.

### D. NEW credentials band — insert between "Condition-Specific Training" and "Related Articles"
```tsx
<Section background="cream">
  <StatStrip
    background="ink"
    stats={[
      { icon: IconAward, value: "L4", label: "Cancer rehab & exercise referral qualified" },
      { icon: IconUsers, value: "1:1", label: "Private one-to-one sessions only" },
      { icon: IconMessageCircle, value: "30 min", label: "Free, no-pressure consultation" },
      { icon: IconClipboardList, value: "Worthing", label: "Private studio, West Sussex" },
    ]}
  />
</Section>
```
Import StatStrip from "@/components/ds" and IconAward/IconUsers/IconMessageCircle/IconClipboardList from "@/components/icons".

### E. "Related Articles" — keep as the icon-card grid BUT change its Section background to "white" so backgrounds still alternate after inserting D (order becomes: ...pages=white, statstrip=cream, articles=white, then teal CTABand).

## File 2: components/HowItWorksSection.tsx (homepage)
This duplicates the card idiom in raw Tailwind. Rebuild its body to use the same ProcessFlow diagram from "@/components/ds" (numbered flow with connecting line) inside its existing section wrapper, keeping the section's heading/eyebrow markup and all copy verbatim. If the component's data array has icons, drop them. Keep any surrounding CTA.

## Acceptance
- No copy changes (diff shows structure only)
- No unused imports left
- Both files compile under `tsc` semantics (do not run builds — just be type-correct)
