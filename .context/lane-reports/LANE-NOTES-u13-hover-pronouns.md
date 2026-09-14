# Lane Notes: u13-hover-pronouns

## BUG-EF-160: Hub hover tokens use --color-* 

Replaced all `var(--rose)`, `var(--ink)`, `var(--teal)` short-form tokens with their canonical `var(--color-rose)`, `var(--color-ink)`, `var(--color-teal)` equivalents across hub CSS and TSX files.

### Files changed (CSS):
- `app/hub/m/mobile.css` — bulk replace of all `var(--rose)`, `var(--ink)`, `var(--teal)` usages throughout

### Files changed (TSX):
- `app/hub/m/availability/AvailabilityScreen.tsx` — `var(--teal)`, `var(--rose)` (lines 356, 470, 481)
- `app/hub/m/train/[sessionId]/TrainScreen.tsx` — `var(--ink)`, `var(--rose)` (lines 2401, 2431-2434)
- `app/hub/m/train/[sessionId]/SwapChooser.tsx` — `var(--rose)` (line 175)
- `app/hub/m/clients/[id]/ClientNotesPane.tsx` — `var(--rose)` (line 379)
- `app/hub/m/clients/[id]/ClientModeView.tsx` — `var(--rose)` (line 584)
- `app/hub/m/clients/[id]/add-workout/page.tsx` — `var(--ink)` (line 625)
- `app/hub/(protected)/clients/[id]/ProgramQueueMap.tsx` — `var(--rose)` (lines 104-105)
- `app/hub/(protected)/clients/[id]/review/ReviewFlowClient.tsx` — `var(--rose)`, `var(--ink)` (lines 354, 435, 961)
- `app/hub/(protected)/clients/[id]/TrainingSummary.tsx` — `var(--rose)`, `var(--ink)` (line 238)
- `app/hub/(protected)/clients/[id]/SessionChooser.tsx` — `var(--rose)`, `var(--ink)` (lines 115, 143, 171, 239, 288)
- `app/hub/(protected)/programs/[id]/ProgramBuilderClient.tsx` — `var(--rose)` (line 679)
- `app/hub/(protected)/clients/[id]/comms/new/CommsComposerClient.tsx` — `var(--rose)`, `var(--ink)` (line 103)
- `app/hub/(protected)/clients/[id]/blocks/[blockId]/SubSessionRow.tsx` — `var(--teal)` (line 43)
- `app/hub/(protected)/clients/[id]/blocks/[blockId]/BlockOverviewClient.tsx` — `var(--rose)`, `var(--ink)` (lines 297, 347, 682)
- `app/hub/(protected)/clients/[id]/blocks/[blockId]/SessionRow.tsx` — `var(--teal)` (line 279)
- `app/hub/(protected)/clients/[id]/blocks/[blockId]/sessions/[sessionNum]/page.tsx` — `var(--teal)` (line 697)
- `app/hub/(protected)/schedule/WeekView.tsx` — `var(--rose)`, `var(--ink)` (lines 232, 243)

## BUG-EF-146: Manage training drawer pronouns

The drawer (`TrainingDrawer.tsx`) already uses `pronouns(gender)` from `lib/pronouns.ts` (line 127) for all rendered text (line 607: `{p.possessiveCapitalized} programme`, line 535: `p.possessive` in template literal). No hardcoded "HER PROGRAMME" or "hers" existed in rendered JSX.

The only remaining hardcoded gendered pronoun was in the code comment at line 24 ("His programme") which has been updated to "Their programme".

### File changed:
- `app/hub/(protected)/clients/[id]/TrainingDrawer.tsx` — comment line 24: "His programme" → "Their programme"

## Verification

- `grep -rn "var(--rose)|var(--ink)|var(--teal)|var(--cream)" app/hub components --include=*.css --include=*.tsx --include=*.ts` = **0 hits**
- `grep -rni "HER PROGRAMME" app/hub components` = **0 hits**
- `npx tsc --noEmit` = **exit 0**

## Out of scope

- The short-form alias declarations in `app/globals.css:52-57` (`--rose: var(--color-rose)`, etc.) and `app/hub/m/mobile.css:10-12` (`.mobile-shell` scope) still exist. They are harmless — nothing in hub code consumes them anymore. Cleaning them up is a separate housekeeping task.
- Marketing pages (.efhome, discovery-call) legitimately use their own `--rose`/`--ink` tokens and were excluded per instructions.
- `lib/pronouns.ts` was not modified per instructions.
