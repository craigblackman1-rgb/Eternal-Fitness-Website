# Lane Notes — ef068-u6-language-sweep (u6)

## What was done

CR-EF-127 language sweep: removed the words "block", "pool", and "rotation" from all rendered UI copy (JSX/TSX literal text) across the Eternal Fitness codebase. Code identifiers, variable names, DB columns, CSS utilities, and Tailwind classes were left untouched.

## Scope

- **16 files changed**, 44 insertions, 44 deletions
- Terms replaced: "block" → "package" (public/legal), "session set" (hub context), "programme" (exercise history), "training plan" (portal empty state)
- "pool" and "rotation" had zero rendered UI hits — only code identifiers exist for these words

## Replacement decisions

| Context | Before | After | Rationale |
|---|---|---|---|
| Public pricing/booking/schema | "Block of 12/24" | "Package of 12/24" | Customer-facing; "package" is clearer than "block" |
| Agreement/terms legal copy | "block of sessions" | "package of sessions" | Consistent with pricing terminology |
| FAQs | "during a block", "blocks of 12/24" | "during my sessions", "packages of 12/24" | Match FAQ voice (first person) |
| Hub arrangement drawer | "current block is a band block" | "current session set uses bands" | Describes the situation, not the data model |
| Hub progress drawer | "Block N" fallback | "Session set N" fallback | Consistent with new terminology |
| WorkoutLog section | "Main block" | "Main set" | Section heading within a session |
| BookSessionsDialog | "Block expiry" | "Package expiry" | Radio label |
| ExerciseHistoryDrawer | "Block N" | "Programme N" | Matches existing line 813 which already uses "Programme" |
| Portal empty state | "training block" | "training plan" | Matches portal's existing "training plan" terminology |
| PAR-Q editor | "next block is planned" | "next session set is planned" | Trainer-facing clinical note |
| Homepage marquee | "Blocks of 12 or 24 Sessions" | "Packages of 12 or 24 Sessions" | Marketing ticker |

## What was NOT changed (by design)

- Code identifiers: `block_id`, `block_number`, `block.title`, `main_block`, `expandedBlock`, `BlockPickerDialog`, `BlockPickerBlock`, `SupersetBlock`, etc.
- CSS utilities: `display: "block"`, `className="...block..."` (Tailwind), `scrollIntoView({ block: "..." })`
- Cookie policy: "block, or remove cookies" — refers to browser cookie blocking, not training terminology
- Photo alt text: "half-kneeling rotation" — exercise movement name, not scheduling concept
- Code comments referencing block/rotation scheduling logic

## Verification

- `tsc --noEmit`: clean, zero errors
- `vitest run`: 26 files, 280 tests, all passed
- Post-edit grep for `\bblock\b` in all .tsx files: all remaining matches are code identifiers, CSS, or cookie policy — zero rendered UI copy hits
- Post-edit grep for "pool" and "rotation" in string literals: zero rendered UI hits

## Files changed (16)

1. `app/HomePageClient.tsx` — marquee ticker text
2. `app/agreement/page.tsx` — legal agreement payment terms
3. `app/book/PublicBookingClient.tsx` — booking service description, footer link
4. `app/faqs/FAQsPageClient.tsx` — FAQ questions and answers (5 edits)
5. `app/hub/(protected)/clients/[id]/ClientDrawers.tsx` — arrangement drawer warnings, progress drawer fallback
6. `app/page.tsx` — homepage schema.org offers
7. `app/parq/edit/[id]/ParqEditClient.tsx` — PAR-Q trainer notes (2 edits)
8. `app/personal-training/page.tsx` — personal training schema.org offers
9. `app/portal/(protected)/training/page.tsx` — portal empty state
10. `app/pricing/PricingPageClient.tsx` — pricing card names, subhead, invest note, section heading (5 edits)
11. `app/pricing/page.tsx` — pricing page schema.org, meta description
12. `app/terms/TermsPageClient.tsx` — terms TOC, payments, cooling-off, packages section (5 edits)
13. `components/FAQSection.tsx` — homepage FAQ section (3 edits)
14. `components/hub/BookSessionsDialog.tsx` — booking dialog radio label
15. `components/workout/ExerciseHistoryDrawer.tsx` — exercise history best-weight display
16. `components/workout/WorkoutLog.tsx` — workout section heading label
