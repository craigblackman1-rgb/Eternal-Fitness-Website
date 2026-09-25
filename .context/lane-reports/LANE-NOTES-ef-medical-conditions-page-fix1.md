# LANE-NOTES — ef-medical-conditions-page-fix1

## fix1 — hero heading escape + image swap

**Heading fix:** Line 61 had `heading={<>The Barrier Isn\u2019t<br />the Diagnosis</>}` — JSX text nodes don't process JS escape sequences, so the literal characters `\u2019` rendered on screen. Wrapped each text segment in a string expression: `{"The Barrier Isn\u2019t"}` and `{"the Diagnosis"}`. Grepped the whole file for other `\u` escapes in raw JSX text — none found; all other instances are already inside `{"..."}` strings.

**Image swap:** Replaced `who-mobility.jpg` with `approach-step3-deadlift-clients.jpg`. Alt text copied verbatim from `app/HomePageClient.tsx:168`. Added `imageObjectPosition="55% 45%"` and `imageObjectPositionWide="60% 40%"` per brief.

**Verification:** `npx tsc --noEmit` clean, 0 errors.
