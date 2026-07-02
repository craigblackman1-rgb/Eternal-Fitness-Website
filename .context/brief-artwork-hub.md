# Brief: artwork accents on 5 pages + visible hub redesign

HARD CONSTRAINTS: no installs, no builds, no git, no deploys. No copy/text changes on marketing pages. TypeScript must stay valid; remove imports that become unused.

New artwork components (already built, exported from `@/components/ds`): `PulseLine` (props: accent "rose"|"teal"|"white"), `MotionArcs` (accent "rose"|"teal"), `JourneyPath` (accent, milestones?: number). CSS helpers in app/design-system.css: `.ds-art-chip` (floating white diagram chip pinned inside a `.ds-split-img`), `.ds-art-divider` (centered 420px), `.ds-art-inline` (340px, margin-top).

Reference implementation: app/personal-training/PersonalTrainingClient.tsx (chip inside the "What I Work On" split image; PulseLine divider under the "How It Works" heading). Copy those exact patterns.

## Part A — marketing pages (2 art moments per page, no more)

1. **app/about/AboutPageClient.tsx**
   - "My Story" split (`id="story"`): inside its `ds-split-img` Reveal add `<div className="ds-art-chip"><JourneyPath accent="rose" milestones={3} /></div>`.
   - "Long-Term Progress" section: add `<div className="ds-art-divider"><PulseLine accent="teal" /></div>` between the SectionHeading and the ProcessFlow wrapper.

2. **app/cancer-rehabilitation/CancerRehabClient.tsx**
   - "What I Know and How I Work" split: add the ds-art-chip with `<PulseLine accent="teal" />` inside the split image — EXCEPTION: for PulseLine use a wider chip: `<div className="ds-art-chip" style={{ width: 210, padding: "16px 14px" }}>`.
   - "Support at Every Stage" section: `ds-art-divider` with `<JourneyPath accent="rose" milestones={3} />` between SectionHeading and the card grid (journey = treatment → remission → post-surgery).

3. **app/exercise-for-health/ExerciseForHealthClient.tsx**
   - "The Approach" split at top: ds-art-chip with `<MotionArcs accent="rose" />` inside the split image.
   - "What to Expect from Your Sessions": `ds-art-divider` with `<PulseLine accent="teal" />` under the SectionHeading (before the ProcessFlow).

4. **app/exercise-for-health/bone-health/BoneHealthClient.tsx** and **5. high-blood-pressure/HighBloodPressureClient.tsx** (same treatment each)
   - "Why It Matters" split: ds-art-chip with `<MotionArcs accent="teal" />` inside the split image.
   - "Session Structure" section: `ds-art-divider` with `<PulseLine accent="rose" />` under the SectionHeading, before the ProcessFlow.

Import the artwork components from `@/components/ds` in each file.

## Part B — hub redesign (visible, keep all functionality identical)

Files under `app/hub/(protected)/`.

1. **HubSidebar.tsx** — restyle to a dark sidebar:
   - Root sidebar container: `bg-dark-navy text-white` (token exists), keep width/layout.
   - Nav links: default `text-white/60 hover:text-white hover:bg-white/5 rounded-xl`; active state `bg-rose text-white rounded-xl` (replace existing active classes).
   - Section labels (if any) `text-white/40 uppercase text-[10px] tracking-widest`.
   - The ClientQuickSearch input: `bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:ring-rose/40`; results dropdown stays white.
   - Sign-out button: ghost white (`text-white/60 hover:text-white hover:bg-white/5`).
   - Logo/title block at top: use `/ef-heart-logo-white.svg` if the sidebar currently shows a logo or text title; label "Eternal Fitness Hub" `text-white font-semibold`, sub-label `text-white/50 text-xs`.
   - Separators: `bg-white/10`.

2. **clients/[id]/page.tsx** — client identity band + consolidated tabs:
   - Replace the current header row (back link + avatar + name + Edit/New Block buttons) with a designed band: a `div` with `rounded-2xl bg-dark-navy text-white p-6 flex items-center gap-5` containing: back chevron link (`text-white/50 hover:text-white`); a `w-16 h-16 rounded-full bg-rose text-white text-xl font-bold flex items-center justify-center` avatar with initials; name as `text-3xl font-bold` white with the existing meta line `text-white/60`; on the right the existing Edit (make `variant="outline"` → `border-white/20 text-white hover:bg-white/10 rounded-full bg-transparent`) and New Block (keep rose pill) buttons. Below name add small stat chips (`rounded-full bg-white/10 px-3 py-1 text-xs text-white/80`) for group type, pace, sessions/week, tier — reuse the values already rendered in the current "Stats row".
   - Consolidate the 7 tabs to 5: `Overview`, `Profile & Compliance`, `Training`, `Plan Agent`, `Updates`.
     - `Profile & Compliance`: render the current Profile tab content, then a separator, then the current Compliance tab content, in ONE TabsContent.
     - `Training`: current Training (blocks) content, then separator, then current Sessions content.
     - Remove the now-duplicated standalone stats row from Overview (it moved into the band chips).
   - TabsList: `grid w-full grid-cols-5` and style triggers as pills: `rounded-full data-[state=active]:bg-rose data-[state=active]:text-white`.
   - Do NOT change any data fetching, handlers, or child component props.

3. **(protected)/page.tsx (dashboard)** — add a compact KPI band at top if not present: a `grid grid-cols-2 md:grid-cols-4 gap-4` of `rounded-2xl bg-dark-navy text-white p-5` tiles showing counts ALREADY available in the page's fetched data (clients count, active blocks, pending/draft blocks, compliance alerts). Only use data the page already fetches — do not add new queries unless a count is trivially derivable from existing fetched arrays. If the dashboard already has equivalent tiles, restyle them to this dark tile treatment instead of duplicating.

## Acceptance
- Marketing pages: copy identical, exactly the specified art placements.
- Hub: all links/actions/data identical; visual changes only as specified; type-correct.
