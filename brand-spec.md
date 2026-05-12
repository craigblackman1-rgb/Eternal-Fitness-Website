# Eternal Fitness — Brand Spec

Extracted from `docs/design-system.html` (production source of truth).

## Colour tokens

```css
--bg:      oklch(99% 0 0);         /* white page background */
--surface: oklch(99% 0 0);         /* card / container surface */
--fg:      oklch(27% 0.015 250);   /* #3C3C3C charcoal body text */
--muted:   oklch(52% 0.015 250);   /* #737373 tertiary text */
--border:  oklch(90% 0.008 250);   /* #E5E5E5 light border */

--teal:       oklch(42% 0.085 195);  /* #087E8B brand primary */
--rose:       oklch(44% 0.065 345);  /* ~#754d63 brand accent (deep muted rose) */
--muted-rose: oklch(62% 0.085 345);  /* #C1839F brand figma primitive */
--charcoal:   oklch(27% 0.015 250);  /* #3C3C3C text / dark surface */
```

## Typography

- **Display + Body:** DM Sans (single family throughout)
- **Weight range:** 400–800
- **Letter-spacing:** -0.02em for display sizes, 0.05em for uppercase captions

## Layout posture

- Full-pill buttons (`--radius-full`)
- Card radius: `--radius-lg` (12px)
- Light shadows, subtle elevation on hover (translateY(-2px))
- Generous whitespace (spacing scale: 0.25rem → 6rem)
- Single accent colour used sparingly — teal for primary, deep muted rose for CTAs
- Deep muted rose (~#754d63) as interactive accent; lighter Figma primitive (#C1839F) retained as brand reference
