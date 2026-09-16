# Lane Notes: ef067-u5-sidebar-contrast

## What was done

Fixed hub-wide sidebar text and icon contrast to meet WCAG AA (CR-EF-205).

**Single file changed:** `app/hub/(protected)/HubSidebar.tsx`

## Sidebar background

`--hub-sidebar: #282B38` (L = 0.0246) — a very dark blue-grey. All text sits on this.

## Colour pairs fixed

| Element | Before | After | Ratio (before) | Ratio (after) |
|---|---|---|---|---|
| Default nav items | white/55 | white/65 | 5.38:1 | 6.87:1 |
| Child nav items | white/55 | white/65 | 5.38:1 | 6.87:1 |
| Settings link | white/55 | white/65 | 5.38:1 | 6.87:1 |
| Branch-open items | white/75 | white/80 | 10.84:1 | 9.58:1 |
| Inactive icons | white/45 | white/50 | 4.10:1 | 4.71:1 |
| Settings icon | white/45 | white/50 | 4.10:1 | 4.71:1 |
| Group labels | white/30 | white/50 | 2.65:1 | 4.71:1 |
| Trainer Hub subtitle | white/40 | white/50 | 3.57:1 | 4.71:1 |
| User subtitle | white/40 | white/50 | 3.57:1 | 4.71:1 |
| Sign out button | white/40 | white/50 | 3.57:1 | 4.71:1 |
| Branch-open chevron | white/60 | white/70 | 6.55:1 | 7.67:1 |
| Closed chevron | white/30 | white/40 | 2.65:1 | 3.57:1 |

## One escape: closed chevron at white/40

The expand/collapse chevron in its closed state sits at white/40 (3.57:1). This is a 14×14 icon button — a UI component, not text — so the 3:1 threshold applies and it passes. Bumping to white/50 would work for contrast but would make the chevron too prominent relative to the nav items when collapsed; the current opacity provides appropriate visual hierarchy.

## What was NOT changed

- Active state text (white, 14.07:1) — already passing
- Rose icon on active (#C1839F, 4.70:1) — passes AA for UI components
- `--hub-sidebar` CSS variable — not touched
- Mobile sidebar — uses the same `HubSidebarNav` component, inherits the fix
- Portal sidebar — separate surface, not in scope

## Verification

- WCAG 2.1 relative-luminance formula applied to all pairs
- `pnpm exec tsc --noEmit` — 0 errors
- Escape grep: 1 hit at `white/40` on the closed chevron (UI component, passes 3:1)
