# Fix brief 1 — ef-img-perf-desc (review findings)

Same worktree/branch. Do NOT run dev servers or push. One commit: `fix(BUG-EF-211): review fixes`.

1. `app/HomePageClient.tsx` hero disclosure has `className="ef-desc ef-desc--overlay-left"` — it is missing the
   base overlay class, so it gets none of the absolute positioning. Change to
   `className="ef-desc ef-desc--overlay ef-desc--overlay-left"`.

2. `app/design-system.css`: the mobile media query sets `right: 12px` on `.ef-desc--overlay`, which (same
   specificity, later) overrides `right: auto` on `--overlay-left`, so the left pill stretches. Replace the
   `@media (max-width: 760px)` block you added with:

```css
@media (max-width: 760px) {
  details.ef-desc.ef-desc--overlay { right: 12px; bottom: 12px; max-width: calc(100% - 24px); }
  details.ef-desc.ef-desc--overlay-left { right: auto; left: 12px; }
}
```

Check `npx tsc --noEmit` passes.
