# Fix brief 1 — ef-medical-conditions-page (review findings)

Same worktree/branch. Do NOT run dev servers or push. One commit: `fix(CR-EF-209): review fixes`.

File: `app/medical-conditions/MedicalConditionsClient.tsx`

1. **Literal `’` rendered in the hero heading.** JSX text does not process JS escapes, so
   `heading={<>The Barrier Isn’t<br />the Diagnosis</>}` shows the characters `’` on the page.
   Change to: `heading={<>{"The Barrier Isn’t"}<br />{"the Diagnosis"}</>}`.
   Then grep the whole file for any other `\u` escape that sits in raw JSX text (outside a `{"..."}` string
   or a JS string literal) and fix it the same way.

2. **Hero image swap.** `who-mobility.jpg` crops the people off the edge. Replace the PageHero props:
   - `image="/images/approach-step3-deadlift-clients.jpg"`
   - `imageAlt` = exactly the alt text already used for that file in `app/HomePageClient.tsx` (copy it character for character).
   - `imageObjectPosition="55% 45%"` and add `imageObjectPositionWide="60% 40%"`.

Check: `npx tsc --noEmit` passes. Add a short "fix1" section to the lane report.
