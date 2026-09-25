# Lane notes — ef-img-perf-desc-fix1

Two fixes applied per the brief:

1. **Hero overlay class missing** — `HomePageClient.tsx:63`: added `ef-desc--overlay` base class
   to the hero `<details>` element so it receives absolute positioning.

2. **Mobile media query override** — `design-system.css:691-693`: added
   `details.ef-desc.ef-desc--overlay-left { right: auto; left: 12px; }` inside the
   `@media (max-width: 760px)` block to prevent the left-positioned pill from stretching
   to the right due to equal specificity with the `.ef-desc--overlay` rule.

tsc clean, no errors. Committed on branch `lane/ef-img-perf-desc`.
