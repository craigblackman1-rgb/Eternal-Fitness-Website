# Lane brief — ef-medical-conditions-page (WO-EF-073, CR-EF-209)

Worktree: `D:\apps\worktrees\eternal-fitness-website\ef-medical-conditions-page` (branch `lane/ef-medical-conditions-page`, off origin/main 3818605).
Do NOT run dev servers, browsers, or `pnpm install`. Do NOT push. Commit to this branch only.
When done, write `.context/lanes/LANE-REPORT-ef-medical-conditions-page.md` listing every file changed.

## What to build

A new public landing page at **`/medical-conditions`**: `app/medical-conditions/page.tsx` (server: metadata +
JSON-LD) and `app/medical-conditions/MedicalConditionsClient.tsx` ("use client").

**Design spec = the live Cancer Rehabilitation page.** Copy its structure, primitives, imports, Navbar/Footer,
`<main id="main-content">`, `BOOKINGS_URL` usage and JSON-LD pattern exactly from
`app/cancer-rehabilitation/page.tsx` and `app/cancer-rehabilitation/CancerRehabClient.tsx`. Use only existing
`components/ds` primitives and existing `ds-*` classes. No new CSS, no new components, no new images.
Do not add `imageDescription` props anywhere on this page.

Rules:
- Use the copy below **verbatim** (it is approved; do not add, embellish or "improve" it; no invented stats,
  testimonials, conditions or claims). Use `\u2014` / `\u2019` style escapes or plain characters consistently with the cancer page.
- Do NOT list specific medical conditions anywhere on the page (house rule: no condition roll-calls).
- For every image, reuse the exact `alt` text already used for that same image file elsewhere in `app/`
  (grep for the filename). If the file has no existing alt text, write a plain factual one and flag it in the report.

## Metadata (page.tsx)
- title: `Exercising With a Medical Condition in Worthing`
- description: `One-to-one personal training in Worthing for people living with a medical condition. Screened properly, paced to you, and adapted to how you feel on the day.`
- canonical: `https://eternal-fitness.co.uk/medical-conditions`
- Service JSON-LD like the cancer page: `@id` `https://eternal-fitness.co.uk/medical-conditions/#service`, name `Personal Training for Medical Conditions Worthing`, serviceType `Personal Training for People With Medical Conditions`, audienceType `Adults living with a stable medical condition who want to exercise safely`, description = the meta description.
- FAQPage JSON-LD built from the FAQ items below (same question/answer text).

## Sections (in order)

### 1. PageHero (full-bleed, same props pattern as cancer page)
- image `/images/who-mobility.jpg`, imageObjectPosition `50% 40%`
- eyebrow: `Training With a Medical Condition`
- heading: `<>The Barrier Isn’t<br />the Diagnosis</>`
- subhead: `One-to-one personal training in Worthing for people living with a medical condition — carrying a diagnosis, a lot of apprehension, or both. Screened properly, paced to you, and adapted to how you feel on the day.`
- primaryCta = bookCta (`Book a Free Consultation`), secondaryCta `{ label: "How I Work", href: "#how-i-work", variant: "ghost-white" }`
- badge: `<StatBadge variant="rose" value="L4" label={"Exercise Referral & Cancer Rehab"} />`

### 2. Section white — split (text left, image right `/images/about-studio-band-stretch.jpg`)
- SectionHeading eyebrow `Why It Stalls` (teal), heading `Nobody said no. But nobody said yes either.`
- Paragraphs (`ds-body`, same spacing as cancer page):
  1. `Living with a medical condition doesn’t mean you have to stop being active. But the fear of causing harm — for you and for the people who love you — often lingers. The old “rest is best” mentality is a comfortable thing to believe when you’re frightened.`
  2. `Medical professionals are understandably wary of advising the wrong thing, so exercise often never enters the conversation. When it isn’t actively recommended, it’s reasonable to assume it isn’t for you.`
  3. `And when your body feels like it has let you down, asking more of it is frightening. That isn’t a motivation problem, and it isn’t solved with a training plan alone. It takes time, and someone willing to go at a pace you can actually manage.`
- Callout icon `IconRibbon` accent rose, title `Qualified beyond standard personal training`, body `GP Exercise Referral qualified, and Level 4 qualified in Cancer and Exercise Rehabilitation (CanRehab). Specialist training to work safely with complex, stable conditions.`
- CtaButton bookCta below.

### 3. Section cream, `id="how-i-work"` — heading + FeatureBand (accent rose)
- SectionHeading eyebrow `How I Work`, heading `Safe First. Then Confident.`
- FeatureBand items:
  1. `Screened properly` — `Before we start I screen properly, and I’m never worried about checking in with your GP or consultant. If you need medical clearance, we get it documented — “my doctor said it’s fine” isn’t enough to keep you safe.`
  2. `The right questions` — `Not “what’s wrong with you?” but “what have you been told to avoid?”, “what does a bad day look like?” and “what have you already tried?” It’s surprising how often someone is carrying a restriction that expired months ago.`
  3. `A pause, not a ban` — `If a condition is acute or unstable, exercise may need to stop for a while. That’s normally a pause, not a permanent ban. Once things settle, it becomes about how, and how much.`

### 4. Section white — split (text left, image right `/images/approach-step2-lunges-together.png`)
- SectionHeading eyebrow `Your First Session` (teal), heading `A Starting Point, Not a Test`
- `ds-featlist` items (same markup as the cancer page's Clinical Considerations list):
  1. `A proper baseline` — `Your first session is a full assessment, so we know where you’re starting from. Not testing you to failure — knowing your starting point is not the same as finding out what breaks you.`
  2. `Leave feeling capable` — `You should leave the first session feeling capable, not exhausted. If you leave wiped out, it only confirms what you were afraid of.`
  3. `Adapted on the day, quietly` — `Your plan adapts to how you feel on the day, without a fuss and without turning every change into a conversation about your condition.`
  4. `No “easier option”` — `An adjustment that lets you perform an exercise with better technique isn’t falling short of anyone. It’s the smarter way to get more from it.`

### 5. Section cream — centred quote using the existing `Callout` (accent teal, no icon if optional, else `IconRibbon`)
- title: `“If something isn’t a big deal to me, it becomes less of a big deal to you.”`
- body: `Most people in your position have spent months being met with concern. Being met with something closer to normal is a relief — and it puts the say in what you’re capable of back with you. — Esther`

### 6. Section white — heading + StatStrip-free FeatureBand (accent teal)
- SectionHeading eyebrow `What Progress Looks Like`, heading `Maintenance Is the Achievement`
- Intro paragraph (`ds-body`, max-width like other intros): `When you’re managing a condition there is no “after” photo. For a progressive or fluctuating condition, holding steady is a real achievement — sometimes the win is that the line didn’t go down.`
- FeatureBand items:
  1. `Sleeping better` — `Often the first change people notice, long before anything shows on the scales.`
  2. `More energy, less pain` — `The everyday wins that make the rest of life easier.`
  3. `Trust in your own body` — `Rebuilt one session at a time, at a pace you can manage.`

### 7. Section cream — honest scope
- SectionHeading eyebrow `Honest About Scope` (teal), heading `If I’m Not the Right Person, I’ll Tell You Who Is`
- Two `ds-body` paragraphs:
  1. `My qualifications let me work with complex, stable conditions. They don’t give me permission to train anyone through acute instability. If what you need sits outside my scope, I’ll say so — as a redirection, not a rejection: “I’m not the right person for this, and here’s who is.”`
  2. `Not every referral has to be a handover, either. Sometimes a programme is best split by expertise — someone else takes the part that needs their qualification, and I keep mine. You don’t lose a trainer. You gain a team.`

### 8. Section white — FaqSplit (accent rose, cta bookCta)
- eyebrow `Common Questions`, heading `Common Questions About Training With a Medical Condition`, intro `If your question is not covered here, just ask — I would always rather you did.`
- items:
  1. `Do I need my GP’s permission first?` — `It depends on your condition and where you are with it. I screen everyone before we start, and if medical clearance is needed we get it documented. I’m always happy to check in with your GP or consultant.`
  2. `What if I have a bad day?` — `Then the session adapts. Every session starts with a check-in, and the plan changes to match how you feel on the day. Being honest about a bad day never means being told you can’t train.`
  3. `What if you’re not the right trainer for me?` — `Then I’ll tell you, and help you find who is. Sometimes that means splitting your programme with another specialist so you get the right expertise for each part.`
  4. `I’m not a “gym person”. Is this for me?` — `Very often, yes. Many of the people I work with never saw themselves as gym people. Training is one-to-one in a private studio in Worthing, so there are no busy gym floors and no one watching.`

### 9. CTABand (same as cancer page)
- image `/images/studio-kettlebell-playful.jpg`, same imageAlt as cancer page
- heading `Ready to find out if this is right for you?`
- body `The first conversation is free, with no commitment. Tell me what you’ve been told, what you’ve tried, and what a bad day looks like — and we’ll take it from there.`
- primaryCta book, secondaryCta `Call: 07517 658 128` tel link (same as cancer page).

## Also
- Add `/medical-conditions` to `app/sitemap.ts` next to the `/cancer-rehabilitation` entry, same priority/changefreq.
- Do NOT add it to the navbar or footer (separate decision).

## Checks before you stop
- `npx tsc --noEmit` passes.
- Grep your new files: zero occurrences of `Lorem`, `TODO`, `placeholder`, and no condition names
  (e.g. diabetes, arthritis, MS, Parkinson, COPD, heart, stroke, cancer — except inside the qualification name
  `Cancer and Exercise Rehabilitation` / `Cancer Rehab` in the Callout/badge).
- `git status` clean after commit.
