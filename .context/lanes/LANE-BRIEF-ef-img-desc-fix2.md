# Fix brief 2 — BUG-EF-211 mobile pill placement

Worktree `D:\apps\worktrees\eternal-fitness-website\ef-medical-conditions-page` (branch `lane/ef-medical-conditions-page`).
Do NOT run dev servers or push. One commit: `fix(BUG-EF-211): overlay pill top-right on mobile`.

Browser check found that on mobile (≤760px) the bottom-corner "Describe this image" pill sits flush against the
hero's last button and 14px under the CTA band's call button. On mobile it must move to the top-right corner.

In `app/design-system.css`, replace the `@media (max-width: 760px)` block that follows the
`details.ef-desc.ef-desc--overlay` rules (the one containing `details.ef-desc.ef-desc--overlay-left { right: auto; left: 12px; }`) with exactly:

```css
@media (max-width: 760px) {
  /* Mobile: hero/CTA buttons stack at the bottom, so the pill moves to the top-right corner (below the fixed nav on heroes) */
  details.ef-desc.ef-desc--overlay,
  details.ef-desc.ef-desc--overlay-left { top: 12px; bottom: auto; right: 12px; left: auto; max-width: calc(100% - 24px); }
  #hero details.ef-desc.ef-desc--overlay,
  .ds-hero details.ef-desc.ef-desc--overlay { top: 84px; }
}
```

No other changes. Check `npx tsc --noEmit` passes.
